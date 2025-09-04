import { NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

export async function GET() {
  try {
    // Check if dist-artifacts directory exists and contains tarballs
    const distArtifactsPath = join(process.cwd(), 'dist-artifacts');

    if (!existsSync(distArtifactsPath)) {
      return NextResponse.json({
        available: false,
        reason: 'dist-artifacts directory not found',
      });
    }

    // Look for agent tarballs
    const tarballPattern = join(distArtifactsPath, 'agent-labportal-*.tgz');
    const tarballs = await glob(tarballPattern);

    if (tarballs.length === 0) {
      return NextResponse.json({
        available: false,
        reason: 'no agent tarballs found',
      });
    }

    // Get the latest tarball
    const latestTarball = tarballs.sort().pop();
    const tarballName = latestTarball ? latestTarball.split('/').pop() : null;

    // Check for corresponding checksum file
    const checksumName = tarballName ? tarballName + '.sha256' : null;
    const checksumPath = checksumName
      ? join(distArtifactsPath, checksumName)
      : null;
    const hasChecksum = checksumPath ? existsSync(checksumPath) : false;

    return NextResponse.json({
      available: true,
      tarballName,
      tarballPath: latestTarball,
      checksumName,
      checksumPath,
      hasChecksum,
      count: tarballs.length,
    });
  } catch (error) {
    console.error('Error checking tarball availability:', error);
    return NextResponse.json({
      available: false,
      reason: 'error checking tarballs',
    });
  }
}
