const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/lusitania/career-path-system/frontend/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

for (let file of files) {
  let filepath = path.join(dir, file);
  let content = fs.readFileSync(filepath, 'utf8');
  
  let original = content;
  
  // Update div
  content = content.replace(/<div style=\{styles\.page\}>/g, '<div className="bento-grid" style={styles.page}>');
  
  // Remove grid specific styles from page since they are now in .bento-grid
  content = content.replace(/display: "grid",\s*gridTemplateColumns: "repeat\(auto-fit, minmax\(320px, 1fr\)\)",\s*gridAutoRows: "minmax\(min-content, max-content\)",\s*gridAutoFlow: "row dense",\s*gap: "24px",\s*maxWidth: "1400px",\s*margin: "0 auto"/g, 'maxWidth: "1600px", margin: "0 auto"');
  
  if (original !== content) {
    fs.writeFileSync(filepath, content);
    console.log(`Updated ${file}`);
  }
}
