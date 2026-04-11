import { spawn } from 'child_process';

const CLAUDE_TIMEOUT_MS = 60_000;

export interface ClaudeCliResult {
  readonly success: boolean;
  readonly output: string;
  readonly error?: string;
}

/**
 * Calls `claude -p "<prompt>"` and returns the stdout output.
 * Rejects on non-zero exit, timeout, or spawn error.
 */
export function callClaude(prompt: string): Promise<ClaudeCliResult> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let settled = false;

    const settle = (result: ClaudeCliResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const proc = spawn('claude', ['-p', prompt], {
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      settle({ success: false, output: '', error: 'Claude CLI timed out after 60 seconds' });
    }, CLAUDE_TIMEOUT_MS);

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        settle({ success: true, output: stdout.trim() });
      } else {
        settle({
          success: false,
          output: stdout.trim(),
          error: `claude exited with code ${code}: ${stderr.trim()}`,
        });
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      settle({
        success: false,
        output: '',
        error: `Failed to spawn claude CLI: ${err.message}`,
      });
    });
  });
}

/**
 * Strips markdown fences (```yaml ... ``` or ``` ... ```) from a string.
 */
export function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:ya?ml)?\s*\n?/gm, '')
    .replace(/^```\s*$/gm, '')
    .trim();
}
