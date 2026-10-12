import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  // Token CSS comes from the @pds/tokens workspace (src/index.ts imports it). Bundle it so
  // dist/index.css stays self-contained, exactly as before the workspace split (ADR 0017).
  noExternal: ['@pds/tokens'],
});
