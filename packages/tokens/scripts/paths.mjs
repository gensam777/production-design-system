/**
 * Repo locations the token pipeline reads and writes (ADR 0013 Phase 4 layout, ADR 0017).
 * Paths are repo-root-relative: entry points (build.mjs, the tests) chdir to REPO_ROOT, so
 * they work from the repo root (`npm run tokens:build`) and from this workspace
 * (`npm run build -w @pds/tokens`) alike, and messages print short paths.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
);

/** Generated, gitignored: IR, web CSS/JS, React Native TS (served by @pds/tokens exports). */
export const BUILD = 'packages/tokens/build';
/** Generated and COMMITTED — they are the sources the Swift package and the Gradle build
 * compile (SwiftPM and Gradle consumers have no Node step). npm run tokens:test checks them. */
export const SWIFT_SOURCES = 'platforms/ios/Sources/PDSTokens';
export const KOTLIN_SOURCES = 'platforms/android/tokens/src/main/kotlin/com/pds/tokens';
