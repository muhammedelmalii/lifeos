#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 LifeOS Setup Check\n');

let hasErrors = false;

// Check critical files
const criticalFiles = [
  'package.json',
  'app.json',
  'tsconfig.json',
  'babel.config.js',
  'app/_layout.tsx',
  'app/index.tsx',
  'src/theme/colors.ts',
  'src/store/auth.ts',
];

console.log('📁 Checking critical files...');
criticalFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    hasErrors = true;
  }
});

// Check node_modules
console.log('\n📦 Checking dependencies...');
if (fs.existsSync('node_modules')) {
  console.log('  ✅ node_modules exists');
} else {
  console.log('  ⚠️  node_modules not found - run "npm install"');
  hasErrors = true;
}

// Check .env
console.log('\n🔐 Checking environment...');
if (fs.existsSync('.env')) {
  console.log('  ✅ .env file exists');
} else {
  console.log('  ⚠️  .env file not found (optional for MVP)');
  console.log('     Copy .env.example to .env if needed');
}

console.log('\n' + (hasErrors ? '❌ Setup incomplete' : '✅ Setup looks good!'));
console.log('\nNext steps:');
console.log('  1. npm install (if not done)');
console.log('  2. npm start');
console.log('  3. Press "i" for iOS or "a" for Android\n');

process.exit(hasErrors ? 1 : 0);

