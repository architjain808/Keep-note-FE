#!/usr/bin/env node

/**
 * Simple script to test production build locally
 * This helps identify issues before deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Testing production build...\n');

try {
  // Clean previous build
  console.log('1. Cleaning previous build...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // Build for production
  console.log('2. Building for production...');
  execSync('npm run build', { stdio: 'inherit' });

  // Check if build files exist
  console.log('3. Verifying build files...');
  const distPath = path.join(__dirname, '..', 'dist', 'keep-clone');
  
  if (!fs.existsSync(distPath)) {
    throw new Error('Build directory not found');
  }

  const requiredFiles = ['index.html', 'main.js', 'styles.css'];
  const missingFiles = requiredFiles.filter(file => {
    const pattern = new RegExp(file.replace('.js', '.*\\.js').replace('.css', '.*\\.css'));
    const files = fs.readdirSync(distPath);
    return !files.some(f => pattern.test(f));
  });

  if (missingFiles.length > 0) {
    throw new Error(`Missing build files: ${missingFiles.join(', ')}`);
  }

  // Check index.html for basic structure
  console.log('4. Validating index.html...');
  const indexPath = path.join(distPath, 'index.html');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  if (!indexContent.includes('<app-root>')) {
    throw new Error('index.html missing <app-root> element');
  }

  console.log('✅ Production build test completed successfully!');
  console.log('\n📁 Build files located in: dist/keep-clone/');
  console.log('🚀 Ready for deployment!');

} catch (error) {
  console.error('❌ Production build test failed:');
  console.error(error.message);
  process.exit(1);
}
