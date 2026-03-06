const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const target = process.argv[2] || 'chrome';
console.log(`[+] Building Vytal for ${target.toUpperCase()}...`);

// Run the normal Webpack build
try {
  execSync('node utils/build.js', { stdio: 'inherit' });
} catch (error) {
  console.error('[!] Build failed.', error);
  process.exit(1);
}

const buildPath = path.join(__dirname, '../build');

// Handle manifest swaps depending on the target browser
if (target === 'firefox') {
  if (fs.existsSync(path.join(buildPath, 'manifest-firefox.json'))) {
    fs.moveSync(
      path.join(buildPath, 'manifest-firefox.json'),
      path.join(buildPath, 'manifest.json'),
      { overwrite: true }
    );
  }
} else {
  // For chrome, remove the firefox manifest so it's not zipped
  if (fs.existsSync(path.join(buildPath, 'manifest-firefox.json'))) {
    fs.removeSync(path.join(buildPath, 'manifest-firefox.json'));
  }
}

// Zip the build output
const archiver = require('archiver');
const zipFileName = `vytal-${target}.zip`;
const output = fs.createWriteStream(path.join(__dirname, `../${zipFileName}`));
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', function() {
  console.log(`[+] Success! Created ${zipFileName} (${archive.pointer()} total bytes)`);
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);
archive.directory(buildPath, false);
archive.finalize();
