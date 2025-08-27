// Test the frontmatter filtering fix
const testContent = `---
cards-deck: 00-English::Misc
^1756272617169
---

##### initiative
#card  [[initiative(n.新方案,专项行动;行动计划;倡议)]]

content here
^1756116682432

##### perspective  
#card  [[perspective(观点)]]

more content
^1756116920906`;

// Simulate the frontmatter filtering logic
function getFrontmatterBlocks(file) {
  const frontmatterBlocks = [];
  const frontmatterRegex = /^---[\s\S]*?^---/gm;
  let match;
  
  while ((match = frontmatterRegex.exec(file)) !== null) {
    frontmatterBlocks.push({
      start: match.index,
      end: match.index + match[0].length
    });
  }
  
  return frontmatterBlocks;
}

function isWithinFrontmatter(matchIndex, frontmatterBlocks) {
  return frontmatterBlocks.some(block => 
    matchIndex >= block.start && matchIndex < block.end
  );
}

// Test inline card regex (original)
const inlineSeparator = "::";
const inlineSeparatorReverse = ":::";
const flags = "gim";

const sepLongest = inlineSeparator.length >= inlineSeparatorReverse.length ? inlineSeparator : inlineSeparatorReverse;
const sepShortest = inlineSeparator.length < inlineSeparatorReverse.length ? inlineSeparator : inlineSeparatorReverse;

const inlineStr = "( {0,3}[#]{0,6})?(?:(?:[\\t ]*)(?:\\d.|[-+*]|#{1,6}))?(.+?) ?(" + sepLongest + "|" + sepShortest + ") ?(.+?)((?: *#[\\p{Letter}\\-\\/_]+)+|$)(?:\\n\\^(\\d{13}))?";
const inlineRegex = new RegExp(inlineStr, flags);

console.log("=== Testing Frontmatter Filtering Fix ===");
console.log("Content has frontmatter with ID ^1756272617169");
console.log();

// Get frontmatter blocks
const frontmatterBlocks = getFrontmatterBlocks(testContent);
console.log("Frontmatter blocks found:", frontmatterBlocks.length);
frontmatterBlocks.forEach((block, i) => {
  console.log(`Block ${i+1}: start=${block.start}, end=${block.end}`);
  console.log(`Content: ${JSON.stringify(testContent.substring(block.start, block.end))}`);
});

console.log("\n=== Testing Inline Card Matches ===");
const allMatches = [...testContent.matchAll(inlineRegex)];
console.log("Total regex matches:", allMatches.length);

let filteredCount = 0;
let keptCount = 0;

allMatches.forEach((match, index) => {
  const matchStart = match.index;
  const isInFrontmatter = isWithinFrontmatter(matchStart, frontmatterBlocks);
  
  console.log(`\nMatch ${index + 1}:`);
  console.log(`- Position: ${matchStart}`);
  console.log(`- Content: ${JSON.stringify(match[0])}`);
  console.log(`- In frontmatter: ${isInFrontmatter}`);
  
  if (isInFrontmatter) {
    console.log(`- ❌ FILTERED OUT (frontmatter match)`);
    filteredCount++;
  } else {
    console.log(`- ✅ KEPT (valid card)`);
    keptCount++;
  }
});

console.log(`\n=== Summary ===`);
console.log(`Total matches: ${allMatches.length}`);
console.log(`Filtered out: ${filteredCount}`);
console.log(`Valid cards: ${keptCount}`);

if (filteredCount > 0 && keptCount === 2) {
  console.log("✅ SUCCESS: Frontmatter matches filtered, valid cards preserved!");
} else {
  console.log("❌ ISSUE: Filtering not working as expected");
}
