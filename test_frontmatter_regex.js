// Test to identify why frontmatter is being matched as inlinecard
const testContent = `---
cards-deck: 00-English::Misc
---

##### initiative
#card  [[initiative(n.新方案,专项行动;行动计划;倡议)]]

content here
^1756116682432

##### perspective  
#card  [[perspective(观点)]]

more content
^1756116920906`;

// Test the inline card regex
const inlineSeparator = "::";
const inlineSeparatorReverse = ":::";
const flags = "gims";

// This is the cardsInlineStyle regex from the code
const sepLongest = inlineSeparator.length >= inlineSeparatorReverse.length ? inlineSeparator : inlineSeparatorReverse;
const sepShortest = inlineSeparator.length < inlineSeparatorReverse.length ? inlineSeparator : inlineSeparatorReverse;

// With inlineID = false (default) - FIXED VERSION v2
const inlineStr = "(?!.*cards-deck:)( {0,3}[#]{0,6})?(?:(?:[\\t ]*)(?:\\d.|[-+*]|#{1,6}))?(.+?) ?(" + sepLongest + "|" + sepShortest + ") ?(.+?)((?: *#[\\p{Letter}\\-\\/_]+)+|$)(?:\\n\\^(\\d{13}))?";
const inlineRegex = new RegExp(inlineStr, flags);

console.log("=== Testing FIXED cardsInlineStyle regex ===");
console.log("Fixed Regex:", inlineStr);
console.log();
console.log("Key change: Added (?!.*cards-deck:) negative lookahead to exclude frontmatter content");
console.log();

const inlineMatches = [...testContent.matchAll(inlineRegex)];
console.log("Inline card matches:", inlineMatches.length);

inlineMatches.forEach((match, index) => {
  console.log(`\nInline Match ${index + 1}:`);
  console.log("Full match:", JSON.stringify(match[0]));
  console.log("Groups:");
  match.slice(1).forEach((group, i) => {
    console.log(`  [${i+1}]: ${JSON.stringify(group)}`);
  });
  
  // Check if this match contains frontmatter content
  if (match[0].includes('cards-deck')) {
    console.log("⚠️  This match contains frontmatter content!");
  }
});

// Test the flashcard with tag regex
const flashcardsTag = "card";
const flashcardStr = "( {0,3}[#]*)((?:[^\\n]\\n?)+?)(#" +
  flashcardsTag +
  "(?:[/-]reverse)?)((?: *#[\\p{Number}\\p{Letter}\\-\\/_]+)*) *([\\s\\S]*?)\\^(\\d{13})";
const flashcardRegex = new RegExp(flashcardStr, flags);

console.log("\n=== Testing flashscardsWithTag regex ===");
console.log("Regex:", flashcardStr);
console.log();

const flashcardMatches = [...testContent.matchAll(flashcardRegex)];
console.log("Flashcard matches:", flashcardMatches.length);

flashcardMatches.forEach((match, index) => {
  console.log(`\nFlashcard Match ${index + 1}:`);
  console.log("Full match preview:", JSON.stringify(match[0].substring(0, 100) + "..."));
  console.log("Question:", JSON.stringify(match[2]));
  console.log("ID:", match[6]);
  
  if (match[0].includes('cards-deck')) {
    console.log("⚠️  This match contains frontmatter content!");
  }
});

// Test with problematic content that has ID in frontmatter
const problematicContent = `---
cards-deck: 00-English::Misc
^1756272617169
---

##### initiative
#card  [[initiative(n.新方案,专项行动;行动计划;倡议)]]

content here
^1756116682432`;

console.log("\n=== Testing FIXED regex with ID in frontmatter ===");
const problematicInlineMatches = [...problematicContent.matchAll(inlineRegex)];
console.log("Fixed problematic inline matches:", problematicInlineMatches.length);

if (problematicInlineMatches.length === 0) {
  console.log("✅ SUCCESS: No frontmatter matches found with fixed regex!");
} else {
  problematicInlineMatches.forEach((match, index) => {
    console.log(`\nMatch ${index + 1}:`);
    console.log("Full match:", JSON.stringify(match[0]));
    if (match[0].includes('cards-deck') || match[0].includes('^1756272617169')) {
      console.log("❌ STILL BROKEN: Frontmatter is being matched!");
    }
  });
}
