import { Anki } from "./anki";
import {
  App,
  FileSystemAdapter,
  FrontMatterCache,
  Notice,
  parseFrontMatterEntry,
  TFile,
} from "obsidian";
import { Parser } from "./parser";
import { ISettings } from "../conf/settings";
import { Card } from "../entities/card";
import { arrayBufferToBase64 } from "../utils";
import { Regex } from "../conf/regex";
import { noticeTimeout } from "../conf/constants";
import { Inlinecard } from "../entities/inlinecard";

interface AnkiCard {
  noteId: number;
  cards: number[];
  tags: string[];
  deckName?: string; // Add optional deckName property
}

export class CardsService {
  private app: App;
  private settings: ISettings;
  private regex: Regex;
  private parser: Parser;
  private anki: Anki;

  private updateFile: boolean = false;
  private totalOffset: number = 0;
  private file: string = '';
  private notifications: string[] = [];

  constructor(app: App, settings: ISettings) {
    this.app = app;
    this.settings = settings;
    this.regex = new Regex(this.settings);
    this.parser = new Parser(this.regex, this.settings);
    this.anki = new Anki();
  }

  public async execute(activeFile: TFile): Promise<string[]> {
    if (!activeFile) {
      return ['No active file found'];
    }
    
    try {
      this.regex.update(this.settings);
      await this.anki.ping();
      
      // Init for the execute phase
      this.updateFile = false;
      this.totalOffset = 0;
      this.notifications = [];
      const filePath = activeFile.basename;
      const sourcePath = activeFile.path;
      // console.info("-------- filePath", filePath);
      // console.info("-------- sourcePath", sourcePath);
      let fileCachedMetadata = this.app.metadataCache.getFileCache(activeFile);
      if (!fileCachedMetadata) {
        return ['No metadata found for file'];
      }
      const frontmatter = fileCachedMetadata.frontmatter;
      // console.info("-------- frontmatter", frontmatter);
      let deckName = "";
      let parseDeckName = parseFrontMatterEntry(frontmatter, "cards-deck");
      // console.info("-------- parseDeckName", parseDeckName);
      if (parseDeckName) {
        deckName = parseDeckName;
      } else if (this.settings.folderBasedDeck && activeFile.parent && activeFile.parent.path !== "/") {
        // If the current file is in the path "programming/java/strings.md" then the deck name is "programming::java"
        deckName = activeFile.parent.path.split("/").join("::");
      } else {
        deckName = this.settings.deck;
      }

      try {
        this.anki.storeCodeHighlightMedias();
        await this.anki.createModels(
          this.settings.sourceSupport,
          this.settings.codeHighlightSupport
        );
        await this.anki.createDeck(deckName);
        this.file = await this.app.vault.read(activeFile);
        if (!this.file.endsWith("\n")) {
          this.file += "\n";
        }
        const globalTags = this.parseGlobalTags(this.file);
        const vaultName = this.app.vault.getName();
        
        const ankiBlocksInFile = this.parser.getAnkiIDsBlocks(this.file) || [];
        
        console.info("-------- ankiBlocksInFile", ankiBlocksInFile);
        // console.info("-------- deckName", deckName);
        // Get all cards from this file's deck to detect deletions
        const allCardsInAnkiDeck = await this.anki.getCardsFromDeck(deckName);
        console.info("-------- allCardsInAnkiDeck", allCardsInAnkiDeck);

        // Always use fileSourceCards for deletion detection, ankiBlocks only for updates
        const ankiCards = ankiBlocksInFile.length > 0
          ? await this.anki.getCards(this.getAnkiIDs(ankiBlocksInFile))
          : [];

        console.info("-------- ankiCards", ankiCards);
        const cards: Card[] = this.parser.generateFlashcards(
          this.file,
          deckName,
          vaultName,
          filePath,
          globalTags
        );
        console.info("-------- cards", cards);
        const [cardsToCreate, cardsToUpdate, cardsNotInAnki] =
          this.filterByUpdate(ankiCards, cards);
        const cardIds: number[] = this.getCardsIds(ankiCards, cards);
        const cardsToDelete: number[] = this.getCardsToDeleteFromAnki(allCardsInAnkiDeck, cards);

        console.info("Flashcards: Cards to create");
        console.info(cardsToCreate);
        console.info("Flashcards: Cards to update");
        console.info(cardsToUpdate);
        console.info("Flashcards: Cards to delete");
        console.info(cardsToDelete);
        if (cardsNotInAnki) {
          console.info("Flashcards: Cards not in Anki (maybe deleted)");
          for (const card of cardsNotInAnki) {
            this.notifications.push(
              `Error: Card with ID ${card.id} is not in Anki!`
            );
          }
        }
        console.info(cardsNotInAnki);

        await this.insertMedias(cards, sourcePath);
        const deletedCards = await this.deleteCardsOnAnki(cardsToDelete, ankiBlocksInFile);
        
        // Add delete notification
        if (cardsToDelete.length > 0) {
          this.notifications.push(`Deleted successfully ${cardsToDelete.length} cards.`);
        }
        const updatedCardIds = await this.updateCardsOnAnki(cardsToUpdate);
        await this.insertCardsOnAnki(cardsToCreate, frontmatter, deckName);
        
        // Add update notification
        if (updatedCardIds.length > 0) {
          this.notifications.push(`Updated successfully ${updatedCardIds.length} cards.`);
        }

        // Update decks if needed - since all cards in this file should be in the same deck,
        // we only need to check if any cards exist and if the current deck differs from target deck
        if (ankiCards.length > 0) {
          const noteIds = ankiCards.map((card: AnkiCard) => card.noteId).filter(id => id) as number[];
          if (noteIds.length > 0) {
            try {
              const currentDeck = await this.anki.getCurrentDeckForNotes(noteIds);
              // console.info("-------- currentDeck", currentDeck);
              // console.info("-------- targetDeck", deckName);
              if (currentDeck && currentDeck !== deckName) {
                // Get all card IDs from the notes to move them
                const allCardIds: number[] = [];
                ankiCards.forEach((ankiCard: AnkiCard) => {
                  if (ankiCard.cards && ankiCard.cards.length > 0) {
                    allCardIds.push(...ankiCard.cards);
                  }
                });
                console.info("-------- cardIds to move", allCardIds);
                if (allCardIds.length > 0) {
                  await this.anki.changeDeck(allCardIds, deckName);
                  this.notifications.push(`Moved ${allCardIds.length} cards from "${currentDeck}" to "${deckName}"`);
                }
              }
            } catch (error) {
              console.error('Error moving cards to deck:', error);
              this.notifications.push("Error: Could not update card decks");
            }
          }
        }

        // Update file
        if (this.updateFile) {
          try {
            this.app.vault.modify(activeFile, this.file);
          } catch (err) {
            Error("Could not update the file.");
            return ["Error: Could not update the file."];
          }
        }

        if (!this.notifications.length) {
          this.notifications.push("Nothing to do. Everything is up to date");
        }
        return this.notifications;
      } catch (err) {
        console.error(err);
        throw new Error("Something went wrong");
      }
    } catch (err) {
      console.error(err);
      return ['Error: ' + (err instanceof Error ? err.message : 'Unknown error')];
    }
  }

  private async insertMedias(cards: Card[], sourcePath: string): Promise<void> {
    try {
      // Currently the media are created for every run, this is not a problem since Anki APIs overwrite the file
      // A more efficient way would be to keep track of the medias saved
      await this.generateMediaLinks(cards, sourcePath);
      await this.anki.storeMediaFiles(cards);
    } catch (err) {
      console.error(err);
      throw new Error("Error: Could not upload medias");
    }
  }

  private async generateMediaLinks(cards: Card[], sourcePath: string): Promise<void> {
    if (this.app.vault.adapter instanceof FileSystemAdapter) {
      for (const card of cards) {
        for (const media of card.mediaNames) {
          const image = this.app.metadataCache.getFirstLinkpathDest(
            decodeURIComponent(media),
            sourcePath
          );
          
          if (!image) continue;
          
          try {
            const binaryMedia = await this.app.vault.readBinary(image);
            card.mediaBase64Encoded.push(arrayBufferToBase64(binaryMedia));
          } catch (err) {
            throw new Error("Error: Could not read media");
          }
        }
      }
    }
  }

  private async insertCardsOnAnki(
    cardsToCreate: Card[],
    frontmatter: FrontMatterCache | undefined,
    deckName: string
  ): Promise<number> {
    if (!cardsToCreate.length) {
      return 0;
    }
    
    let insertedCards = 0;
    try {
      const ids = await this.anki.addCards(cardsToCreate);
      // Add IDs from response to Flashcard[]
      ids.forEach((id: number, index: number) => {
        cardsToCreate[index].id = id;
      });

      let total = 0;
      cardsToCreate.forEach((card) => {
        if (card.id === null) {
          console.warn(`Could not add card: '${card.initialContent}' (possibly duplicate)`);
        } else {
          card.reversed ? (insertedCards += 2) : insertedCards++;
        }
        card.reversed ? (total += 2) : total++;
      });

      if (frontmatter) {
        this.updateFrontmatter(frontmatter, deckName);
      }
      this.writeAnkiBlocks(cardsToCreate);

      if (insertedCards > 0) {
        this.notifications.push(
          `Inserted successfully ${insertedCards}/${total} cards.`
        );
      } else {
        this.notifications.push(
          `No new cards created (${total} cards already exist).`
        );
      }
      return insertedCards;
    } catch (err) {
      console.error('Error in insertCardsOnAnki:', err);
      // Don't throw error for duplicate cards, just log and continue
      if (err instanceof Error && err.message.includes('duplicate')) {
        this.notifications.push('Cards already exist in Anki.');
        return 0;
      }
      this.notifications.push('Error: Could not write cards on Anki');
      return 0;
    }
  }

  private async updateFrontmatter(frontmatter: FrontMatterCache, deckName: string): Promise<void> {
    if (!frontmatter || !this.file) {
      console.error('Frontmatter or file content is empty');
      return;
    }

    const cardsDeckLine = `cards-deck: ${deckName}\n`;
    const oldFrontmatter = this.file.substring(
      frontmatter.position.start.offset,
      frontmatter.position.end.offset
    );

    if (oldFrontmatter.match(this.regex.cardsDeckLine)) {
      return; // Cards deck line already exists
    }

    const newFrontmatter = oldFrontmatter.replace(
      /(\s*)---/,
      `$1${cardsDeckLine}---`
    );

    this.totalOffset += cardsDeckLine.length;
    this.file = this.file.substring(0, frontmatter.position.start.offset) +
               newFrontmatter +
               this.file.substring(frontmatter.position.end.offset);
  }

  private writeAnkiBlocks(cardsToCreate: Card[]): void {
    for (const card of cardsToCreate) {
      if (card.id !== null && !card.inserted) {
        let id = card.getIdFormat();
        if (card instanceof Inlinecard) {
          id = this.settings.inlineID ? ` ${id}` : `\n${id}`;
        }
        
        card.endOffset += this.totalOffset;
        const offset = card.endOffset;
        this.updateFile = true;
        
        this.file = this.file.substring(0, offset) +
                   id +
                   this.file.substring(offset);
        this.totalOffset += id.length;
      }
    }
  }

  private async deleteCardsOnAnki(cardIds: number[], ankiBlocks: RegExpMatchArray[]): Promise<number> {
    if (!cardIds.length) return 0;
    
    try {
      await this.anki.deleteCards(cardIds);
      return cardIds.length;
    } catch (error) {
      console.error('Error deleting cards from Anki:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }

  private async updateCardsOnAnki(cards: Card[]): Promise<number[]> {
    if (!cards.length) return [];
    
    try {
      const ids = await this.anki.updateCards(cards);
      return ids;
    } catch (error) {
      console.error('Error updating cards in Anki:', error);
      return [];
    }
  }


  private getAnkiIDs(blocks: RegExpMatchArray[]): number[] {
    return blocks.map(block => {
      return Number(block[1]);
    });
  }

  private getCardsToDeleteFromAnki(fileSourceCards: any[], generatedCards: Card[]): number[] {
    // Get all current file card IDs from the file
    const currentFileCardIds = new Set();
    const ankiBlocks = this.parser.getAnkiIDsBlocks(this.file) || [];
    ankiBlocks.forEach(block => {
      const id = Number(block[1]);
      if (!isNaN(id)) {
        currentFileCardIds.add(id);
      }
    });
    
    // Find cards that exist in Anki for this file but are no longer in the current file
    return fileSourceCards
      .filter((card: any) => card.noteId && !currentFileCardIds.has(Number(card.noteId)))
      .map((card: any) => Number(card.noteId))
      .filter(id => !isNaN(id));
  }

  private filterByUpdate(ankiCards: AnkiCard[], generatedCards: Card[]): [Card[], Card[], Card[]] {
    const cardsToCreate: Card[] = [];
    const cardsToUpdate: Card[] = [];
    const cardsNotInAnki: Card[] = [];

    for (const flashcard of generatedCards) {
      let ankiCard: AnkiCard | undefined;
      if (flashcard.inserted) {
        ankiCard = ankiCards.find(card => Number(card.noteId) === flashcard.id);
        if (!ankiCard) {
          cardsNotInAnki.push(flashcard);
        } else if (!flashcard.match(ankiCard)) {
          flashcard.oldTags = ankiCard.tags;
          cardsToUpdate.push(flashcard);
        }
      } else {
        cardsToCreate.push(flashcard);
      }
    }

    return [cardsToCreate, cardsToUpdate, cardsNotInAnki];
  }

  private getCardsIds(ankiCards: AnkiCard[], generatedCards: Card[]): number[] {
    const ids: number[] = [];
    
    for (const flashcard of generatedCards) {
      if (flashcard.inserted && flashcard.id) {
        const ankiCard = ankiCards.find(card => Number(card.noteId) === flashcard.id);
        if (ankiCard?.cards?.length) {
          ids.push(...ankiCard.cards);
        }
      }
    }
    
    return ids;
  }

  private parseGlobalTags(file: string): string[] {
    if (!file) return [];
    
    const tags = file.match(/(?:cards-)?tags: ?(.*)/im);
    if (!tags || !tags[1]) return [];
    
    const matchedTags = tags[1].match(this.regex.globalTagsSplitter);
    if (!matchedTags) return [];
    
    return matchedTags.map(tag => {
      return tag
        .replace("#", "")
        .replace(/\//g, "::")
        .replace(/\[\[(.*)\]\]/, "$1")
        .trim()
        .replace(/ /g, "-");
    });
  }
}
