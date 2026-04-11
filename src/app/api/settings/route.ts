import { NextRequest, NextResponse } from 'next/server';
import { readSettings, writeSettings } from '@/lib/file-ops';
import type { ApiResponse } from '@/types/resources';

export async function GET(): Promise<NextResponse<ApiResponse<Record<string, unknown>>>> {
  try {
    const settings = await readSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to read settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Record<string, unknown>>>> {
  try {
    const body = await request.json() as Record<string, unknown>;
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Request body must be a JSON object' },
        { status: 400 }
      );
    }

    await writeSettings(body);
    const updated = await readSettings();
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
