/**
 * Version utilities for Lab Portal
 * Provides access to the current version from package.json
 */

import packageJson from '../../package.json';

export const VERSION = packageJson.version;

export function getVersionDisplay(): string {
  return `v${VERSION}`;
}
