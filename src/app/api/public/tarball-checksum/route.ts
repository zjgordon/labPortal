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
        {
          error: 'No tarballs available',
          reason: 'dist-artifacts directory not found',
        },
        { status: 404 }
      );
    }

    // Look for agent tarballs
    const tarballPattern = join(distArtifactsPath, 'agent-labportal-*.tgz');
    const tarballs = await glob(tarballPattern);

    if (tarballs.length === 0) {
      return NextResponse.json(
        {
          error: 'No tarballs available',
          reason: 'no agent tarballs found',
        },
        { status: 404 }
      );
    }

    // Get the latest tarball
    const latestTarball = tarballs.sort().pop();
    if (!latestTarball) {
      return NextResponse.json(
        {
          error: 'No tarball found',
          reason: 'no valid tarball found',
        },
        { status: 404 }
      );
    }

    const tarballName = latestTarball.split('/').pop();
    const checksumPath = latestTarball + '.sha256';

    // Check if checksum file exists
    if (!existsSync(checksumPath)) {
      return NextResponse.json(
        {
          error: 'No checksum available',
          reason: 'checksum file not found',
          filename: tarballName,
        },
        { status: 404 }
      );
    }

    // Read the checksum file
    const checksumContent = await readFile(checksumPath, 'utf-8');

    // Extract just the SHA256 hash (first 64 characters before the first space)
    const sha256Match = checksumContent.match(/^([a-f0-9]{64})/);
    if (!sha256Match) {
      return NextResponse.json(
        {
          error: 'Invalid checksum format',
          reason: 'checksum file format is invalid',
          filename: tarballName,
        },
        { status: 500 }
      );
    }

    const sha256 = sha256Match[1];

    return NextResponse.json({
      filename: tarballName,
      sha256: sha256,
      checksumFile: tarballName + '.sha256',
    });
  } catch (error) {
    console.error('Error fetching tarball checksum:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch checksum',
        reason: 'internal server error',
      },
      { status: 500 }
    );
  }
}
