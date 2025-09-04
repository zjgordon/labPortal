import { NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';
import { readFile } from 'fs/promises';

export async function GET() {
  try {
    // Check if dist-artifacts directory exists and contains tarballs
    const distArtifactsPath = join(process.cwd(), 'dist-artifacts');

    if (!existsSync(distArtifactsPath)) {
      return NextResponse.json(
        { error: 'No tarballs available' },
        { status: 404 }
      );
    }

    // Look for agent tarballs
    const tarballPattern = join(distArtifactsPath, 'agent-labportal-*.tgz');
    const tarballs = await glob(tarballPattern);

    if (tarballs.length === 0) {
      return NextResponse.json(
        { error: 'No agent tarballs found' },
        { status: 404 }
      );
    }

    // Get the latest tarball
    const latestTarball = tarballs.sort().pop();
    if (!latestTarball) {
      return NextResponse.json({ error: 'No tarball found' }, { status: 404 });
    }

    const tarballName = latestTarball.split('/').pop();

    // Read the tarball file
    const tarballBuffer = await readFile(latestTarball);

    // Return the file as a download
    return new NextResponse(tarballBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${tarballName}"`,
        'Content-Length': tarballBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading tarball:', error);
    return NextResponse.json(
      { error: 'Failed to download tarball' },
      { status: 500 }
    );
  }
}
