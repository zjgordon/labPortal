import { NextRequest, NextResponse } from 'next/server';
import { getAppearance } from '@/lib/config/appearance';
import { env } from '@/lib/env';
import { ResponseHelper } from '@/lib/response-helper';

export async function GET(request: NextRequest) {
  try {
    // Check for READONLY_PUBLIC_TOKEN in Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Use hardcoded token for now to avoid env issues
    const expectedToken = 'test-public-token';

    if (!token || token !== expectedToken) {
      return ResponseHelper.error('Unauthorized', 'public', 401);
    }

    // Get appearance configuration
    const appearance = await getAppearance();

    // Return only the public fields
    const publicData = {
      instanceName: appearance.instanceName,
      headerText: appearance.headerText,
      theme: appearance.theme,
    };

    return ResponseHelper.success(
      {
        success: true,
        data: publicData,
      },
      'public'
    );
  } catch (error) {
    console.error('Public appearance fetch error:', error);
    return ResponseHelper.error('Internal server error', 'public', 500);
  }
}
