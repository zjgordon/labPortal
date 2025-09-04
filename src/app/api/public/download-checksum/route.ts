import { NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';
import { readFile } from 'fs/promises';

export async function GET() {
  try {
    // Check if dist-artifacts directory exists and contains checksum files
    const distArtifactsPath = join(process.cwd(), 'dist-artifacts');

    if (!existsSync(distArtifactsPath)) {
      return NextResponse.json(
        { error: 'No checksum files available' },
        { status: 404 }
      );
    }

    // Look for agent checksum files
    const checksumPattern = join(
      distArtifactsPath,
      'agent-labportal-*.tgz.sha256'
    );
    const checksums = await glob(checksumPattern);

    if (checksums.length === 0) {
      return NextResponse.json(
        { error: 'No agent checksum files found' },
        { status: 404 }
      );
    }

    // Get the latest checksum file
    const latestChecksum = checksums.sort().pop();
    if (!latestChecksum) {
      return NextResponse.json(
        { error: 'No checksum file found' },
        { status: 404 }
      );
    }

    const checksumName = latestChecksum.split('/').pop();

    // Read the checksum file
    const checksumContent = await readFile(latestChecksum, 'utf-8');

    // Return the checksum file as a download
    return new NextResponse(checksumContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${checksumName}"`,
        'Content-Length': Buffer.byteLength(
          checksumContent,
          'utf-8'
        ).toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading checksum file:', error);
    return NextResponse.json(
      { error: 'Failed to download checksum file' },
      { status: 500 }
    );
  }
}
