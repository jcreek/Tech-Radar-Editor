import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const packagesDir = join(process.cwd(), 'packages');

const packageDirs = readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(packagesDir, entry.name));

const missingTags = [];

for (const packageDir of packageDirs) {
  const manifestPath = join(packageDir, 'package.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  if (manifest.private) {
    continue;
  }

  const expectedTag = `${manifest.name}-v${manifest.version}`;
  const existingTag = execFileSync('git', ['tag', '--list', expectedTag], {
    cwd: process.cwd(),
    encoding: 'utf8',
  }).trim();

  if (!existingTag) {
    missingTags.push({
      name: manifest.name,
      version: manifest.version,
      tag: expectedTag,
    });
  }
}

if (missingTags.length > 0) {
  console.error('Release baseline is incomplete.');
  console.error('Create tags for the versions that were already published before semantic-release was enabled:');

  for (const pkg of missingTags) {
    console.error(`- ${pkg.name}: expected tag ${pkg.tag}`);
  }

  console.error('');
  console.error('Example commands:');

  for (const pkg of missingTags) {
    console.error(`  git tag ${pkg.tag}`);
  }

  console.error('  git push origin --tags');
  process.exit(1);
}

console.log('Release baseline tags are present for all publishable packages.');
