import { NextResponse } from 'next/server';
import type { ApiResponse, ProjectSummary } from '@/types/resources';

/**
 * Auto-scanning endpoint removed.
 * Projects are now opened manually via POST /api/projects/open.
 */
export async function GET(): Promise<NextResponse<ApiResponse<readonly ProjectSummary[]>>> {
  return NextResponse.json({
    success: true,
    data: [],
  });
}
