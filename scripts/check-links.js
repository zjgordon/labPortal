#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to extract markdown links from a file
function extractLinks(content, filePath) {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links = [];
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
        const [, text, url] = match;
        if (!url.startsWith('http') && !url.startsWith('mailto:') && !url.startsWith('#')) {
            links.push({
                text: text.trim(),
                url: url.trim(),
                line: content.substring(0, match.index).split('\n').length,
                file: filePath
            });
        }
    }
    
    return links;
}

// Function to check if a file exists
function fileExists(filePath, baseDir) {
    const fullPath = path.resolve(baseDir, filePath);
    return fs.existsSync(fullPath);
}

// Function to check links in a directory
function checkLinksInDirectory(dirPath, baseDir = '.') {
    const files = fs.readdirSync(dirPath);
    const allLinks = [];
    
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            allLinks.push(...checkLinksInDirectory(fullPath, baseDir));
        } else if (file.endsWith('.md')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const links = extractLinks(content, fullPath);
            allLinks.push(...links);
        }
    }
    
    return allLinks;
}

// Main execution
console.log('🔍 Checking documentation links...\n');

const docsDir = './docs';
const baseDir = '.';

if (!fs.existsSync(docsDir)) {
    console.error('❌ docs/ directory not found!');
    process.exit(1);
}

const allLinks = checkLinksInDirectory(docsDir, baseDir);
console.log(`Found ${allLinks.length} relative links in documentation files.\n`);

let brokenLinks = 0;
let workingLinks = 0;

for (const link of allLinks) {
    const exists = fileExists(link.url, path.dirname(link.file));
    if (exists) {
        workingLinks++;
        console.log(`✅ ${link.file}:${link.line} - ${link.text} -> ${link.url}`);
    } else {
        brokenLinks++;
        console.log(`❌ ${link.file}:${link.line} - ${link.text} -> ${link.url} (BROKEN)`);
    }
}

console.log(`\n📊 Summary:`);
console.log(`   Working links: ${workingLinks}`);
console.log(`   Broken links: ${brokenLinks}`);

if (brokenLinks > 0) {
    console.log(`\n❌ Found ${brokenLinks} broken links that need to be fixed.`);
    process.exit(1);
} else {
    console.log(`\n✅ All documentation links are working correctly!`);
}
