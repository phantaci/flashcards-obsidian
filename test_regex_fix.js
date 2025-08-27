// Test different approaches to exclude frontmatter
const testContent = `---
cards-deck: 00-English::Misc
---

##### initiative
#card  [[initiative(n.新方案,专项行动;行动计划;倡议)]]

content here
^1756116682432`;

const problematicContent = `---
cards-deck: 00-English::Misc
^1756272617169
---

##### initiative
#card  [[initiative(n.新方案,专项行动;行动计划;倡议)]]

content here
^1756116682432`;

// Original problematic regex
const originalRegex = /(.+?) ?(::|:::) ?(.+?)((?: *#[\p{Letter}\-\/_]+)+|$)(?:\n\^(\d{13}))?/gim;

console.log("=== Original Regex Test ===");
const originalMatches = [...problematicContent.matchAll(originalRegex)];
console.log("Original matches:", originalMatches.length);
originalMatches.forEach((match, i) => {
  if (match[0].includes('cards-deck')) {
    console.log(`❌ Match ${i+1} contains frontmatter:`, JSON.stringify(match[0].substring(0, 50)));
  }
});

// Better approach: exclude matches that start within frontmatter blocks
function filterFrontmatterMatches(content, regex) {
  const matches = [...content.matchAll(regex)];
  const frontmatterBlocks = [];
  
  // Find all frontmatter blocks
  const frontmatterRegex = /^---[\s\S]*?^---/gm;
  let fmMatch;
  while ((fmMatch = frontmatterRegex.exec(content)) !== null) {
    frontmatterBlocks.push({
      start: fmMatch.index,
      end: fmMatch.index + fmMatch[0].length
    });
  }
  
  // Filter out matches that fall within frontmatter blocks
  return matches.filter(match => {
    const matchStart = match.index;
    return !frontmatterBlocks.some(block => 
      matchStart >= block.start && matchStart < block.end
    );
  });
}

console.log("\n=== Filtered Approach Test ===");
const filteredMatches = filterFrontmatterMatches(problematicContent, originalRegex);
console.log("Filtered matches:", filteredMatches.length);

if (filteredMatches.length === 0) {
  console.log("✅ SUCCESS: No frontmatter matches after filtering!");
} else {
  filteredMatches.forEach((match, i) => {
    console.log(`Match ${i+1}:`, JSON.stringify(match[0].substring(0, 50)));
    if (match[0].includes('cards-deck')) {
      console.log("❌ Still contains frontmatter");
    }
  });
}
