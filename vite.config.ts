import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { validateResults } from './src/lib/validate.ts';

// Refuses to build if public/data/results.json breaks the contract in src/types.ts,
// so bad data can never reach a deployed site. In dev the same check runs in the browser.
function validateResultsOnBuild(): Plugin {
  return {
    name: 'doorway-validate-results',
    apply: 'build',
    buildStart() {
      const file = resolve(import.meta.dirname, 'public/data/results.json');
      let data: unknown;
      try {
        data = JSON.parse(readFileSync(file, 'utf8'));
      } catch (err) {
        this.error(`public/data/results.json could not be read as JSON: ${(err as Error).message}`);
      }
      const errors = validateResults(data);
      if (errors.length > 0) {
        this.error(`public/data/results.json failed validation:\n  - ${errors.join('\n  - ')}`);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), validateResultsOnBuild()],
});
