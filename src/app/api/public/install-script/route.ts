import { NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { join } from 'path';
import { readFile } from 'fs/promises';

export async function GET() {
  try {
    // Look for the guided installer script
    const installerPath = join(
      process.cwd(),
      'agent',
      'packaging',
      'install-guided.sh'
    );

    if (!existsSync(installerPath)) {
      return NextResponse.json(
        { error: 'Installer script not found' },
        { status: 404 }
      );
    }

    // Read the installer script
    const installerContent = await readFile(installerPath, 'utf-8');

    // Return the script as a downloadable file
    return new NextResponse(installerContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="install-guided.sh"',
        'Content-Length': Buffer.byteLength(
          installerContent,
          'utf-8'
        ).toString(),
      },
    });
  } catch (error) {
    console.error('Error serving install script:', error);
    return NextResponse.json(
      { error: 'Failed to serve install script' },
      { status: 500 }
    );
  }
}
