#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Simple link checker for markdown files
function checkLinks() {
  console.log('🔍 Checking markdown links...');
  
  try {
    // Find all markdown files (ignore node_modules and other build directories)
    const markdownFiles = glob.sync('**/*.md', {
      ignore: [
        'node_modules/**', 
        '.git/**', 
        '.next/**', 
        'dist/**',
        'agent/node_modules/**',
        'agent/dist/**'
      ]
    });
    
    console.log(`Found ${markdownFiles.length} markdown files`);
    
    let totalLinks = 0;
    let brokenLinks = 0;
    
    for (const file of markdownFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const links = extractLinks(content);
      
      totalLinks += links.length;
      
      for (const link of links) {
        if (link.startsWith('http')) {
          // Skip external links for now to avoid network calls
          continue;
        }
        
        if (link.startsWith('#')) {
          // Skip anchor links
          continue;
        }
        
        // Check internal file links
        if (link.startsWith('./') || link.startsWith('../') || !link.startsWith('http')) {
          const linkPath = path.resolve(path.dirname(file), link);
          if (!fs.existsSync(linkPath)) {
            console.log(`❌ Broken link in ${file}: ${link}`);
            brokenLinks++;
          }
        }
      }
    }
    
    console.log(`\n📊 Link check complete:`);
    console.log(`   Total links found: ${totalLinks}`);
    console.log(`   Broken links: ${brokenLinks}`);
    
    if (brokenLinks > 0) {
      process.exit(1);
    } else {
      console.log('✅ All internal links are valid!');
    }
    
  } catch (error) {
    console.error('❌ Error checking links:', error.message);
    process.exit(1);
  }
}

function extractLinks(content) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [];
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    links.push(match[2]);
  }
  
  return links;
}

// Run the check
checkLinks();
