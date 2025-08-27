// Simple test to avoid infinite loops
const testContent = `---
cards-deck: 00-English::Misc
---

##### initiative
#card  [[initiative(n.新方案,专项行动;行动计划;倡议)]]

content here
^1756116682432`;

const flags = "gim"; // Removed 's' flag to avoid issues

// Test the negative lookahead approach
const inlineStr = "(?!.*cards-deck:)(.+?) ?(::|:::) ?(.+?)";
const inlineRegex = new RegExp(inlineStr, flags);

console.log("=== Simple Test ===");
console.log("Regex:", inlineStr);

const matches = [...testContent.matchAll(inlineRegex)];
console.log("Matches found:", matches.length);

if (matches.length === 0) {
  console.log("✅ SUCCESS: No frontmatter matches!");
} else {
  matches.forEach((match, index) => {
    console.log(`Match ${index + 1}:`, JSON.stringify(match[0]));
    if (match[0].includes('cards-deck')) {
      console.log("❌ Still matching frontmatter");
    }
  });
}
