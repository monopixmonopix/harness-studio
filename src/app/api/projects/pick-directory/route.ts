import { NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import type { ApiResponse } from '@/types/resources';

interface PickResult {
  readonly path: string;
}

export async function POST(): Promise<NextResponse<ApiResponse<PickResult>>> {
  try {
    const selectedPath = await openDirectoryPicker();
    if (!selectedPath) {
      return NextResponse.json(
        { success: false, error: 'No directory selected' },
        { status: 400 }
      );
    }

    const resolved = path.resolve(selectedPath);
    const homeDir = os.homedir();

    if (!resolved.startsWith(homeDir)) {
      return NextResponse.json(
        { success: false, error: 'Path not allowed: must be within home directory' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: { path: resolved } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to pick directory';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

function openDirectoryPicker(): Promise<string | null> {
  const platform = process.platform;

  if (platform === 'darwin') {
    return runCommand('osascript', [
      '-e',
      'tell application "Finder" to activate',
      '-e',
      'set chosenFolder to choose folder with prompt "Select Project Directory"',
      '-e',
      'return POSIX path of chosenFolder',
    ]);
  }

  if (platform === 'linux') {
    return runCommand('zenity', ['--file-selection', '--directory', '--title=Select Project Directory']);
  }

  return Promise.resolve(null);
}

function runCommand(cmd: string, args: readonly string[]): Promise<string | null> {
  return new Promise((resolve) => {
    execFile(cmd, [...args], { timeout: 60000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[pick-directory] ${cmd} failed:`, error.message);
        if (stderr) {
          console.error(`[pick-directory] stderr:`, stderr);
        }
        resolve(null);
        return;
      }
      const result = stdout.trim().replace(/\/+$/, '');
      resolve(result || null);
    });
  });
}
