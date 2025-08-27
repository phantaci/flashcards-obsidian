// Test the flashcard regex with the user's actual card content
const testCard = `##### initiative
#card  [[initiative(n.新方案,专项行动;行动计划;倡议)]]


| init       |                       |         |
| ---------- | --------------------- | ------- |
| initi      | init + i              | 开始      |
| initiate   | initi + ate 动词后缀      | 发起/入门   |
| initiative | initiate + ive 形/名词后缀 | 新方案     |
|            |                       |         |
| initial    | init + ial            | 最初的     |
| initiation | initiate + ion        | 开始/入会仪式 |

init
initi: init + i -> initi 开始
initiate: initi + ate 动词后缀-> initiate 发起/入门
initiative: initiate + ive 形/名词后缀 -> initiative
* init + ial -> initial 最初的
* initiate + ion -> initiation 开始/入会仪式

n.新方案,专项行动
* Def: A n**ew plan or action** to address a problem or achieve a goal. (通常由政府或组织发起)
- Eg: the Illinois blockchain **initiative** is a state government **initiative**
^1756116682432`;

// Test different regex patterns
const flashcardsTag = "card";
const flags = "gims";

// Original broken regex
const str1 = "( {0,3}[#]*)((?:[^\\n]\\n?)+?)(#" +
  flashcardsTag +
  "(?:[/-]reverse)?)((?: *#[\\p{Number}\\p{Letter}\\-\\/_]+)*) *?(?:\\n+|\\s+)(.*?)(?:\\^(\\d{13}))?";

// Fixed regex - simpler approach
const str2 = "( {0,3}[#]*)((?:[^\\n]\\n?)+?)(#" +
  flashcardsTag +
  "(?:[/-]reverse)?)((?: *#[\\p{Number}\\p{Letter}\\-\\/_]+)*) *([\\s\\S]*?)\\^(\\d{13})";

const regex1 = new RegExp(str1, flags);
const regex2 = new RegExp(str2, flags);

console.log("\n" + "=".repeat(50));
console.log("TESTING ORIGINAL REGEX (BROKEN):");
const matches1 = [...testCard.matchAll(regex1)];
console.log("Number of matches:", matches1.length);
if (matches1.length > 0) {
  console.log("ID found:", matches1[0][6]);
}

console.log("\n" + "=".repeat(50));
console.log("TESTING FIXED REGEX:");
const matches2 = [...testCard.matchAll(regex2)];
console.log("Number of matches:", matches2.length);
if (matches2.length > 0) {
  console.log("ID found:", matches2[0][6]);
  console.log("Answer content length:", matches2[0][5].length);
}

const matches = matches2; // Use the fixed regex for detailed output

if (matches.length > 0) {
  matches.forEach((match, index) => {
    console.log(`\nMatch ${index + 1}:`);
    console.log("Full match:", JSON.stringify(match[0]));
    console.log("Groups:");
    match.forEach((group, groupIndex) => {
      if (groupIndex === 0) return; // Skip full match
      console.log(`  Group ${groupIndex}: ${JSON.stringify(group)}`);
    });
    
    // Extract key parts
    const headingLevel = match[1];
    const question = match[2];
    const cardTag = match[3];
    const otherTags = match[4];
    const answer = match[5];
    const id = match[6];
    
    console.log("\nExtracted parts:");
    console.log("Heading level:", JSON.stringify(headingLevel));
    console.log("Question:", JSON.stringify(question));
    console.log("Card tag:", JSON.stringify(cardTag));
    console.log("Other tags:", JSON.stringify(otherTags));
    console.log("Answer:", JSON.stringify(answer));
    console.log("ID:", JSON.stringify(id));
    
    console.log("\nParsed values:");
    console.log("ID as number:", id ? Number(id) : -1);
    console.log("Inserted:", id ? true : false);
  });
} else {
  console.log("No matches found!");
  
  // Let's try to debug by testing simpler patterns
  console.log("\nDebugging - testing simpler patterns:");
  
  const simpleRegex1 = /#card/g;
  const matches1 = [...testCard.matchAll(simpleRegex1)];
  console.log("Simple #card matches:", matches1.length);
  
  const simpleRegex2 = /\^(\d{13})/g;
  const matches2 = [...testCard.matchAll(simpleRegex2)];
  console.log("Simple ID matches:", matches2.length);
  if (matches2.length > 0) {
    console.log("Found ID:", matches2[0][1]);
  }
}
