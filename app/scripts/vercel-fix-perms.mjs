#!/usr/bin/env node

import { chmod } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const nextBinPath = join(process.cwd(), 'node_modules', '.bin', 'next');

if (existsSync(nextBinPath)) {
  try {
    await chmod(nextBinPath, 0o755);
    console.log('Fixed permissions for next binary');
  } catch (error) {
    console.warn('Could not fix permissions for next binary:', error.message);
    // Don't fail the build if chmod fails
  }
} else {
  console.log('next binary not found, skipping permission fix');
}

