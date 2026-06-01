import sdk from '@stackblitz/sdk';
import { ensureLucideImports } from '../agents/tools';

/**
 * Packages the generated component into a full Vite + Tailwind v4 project payload 
 * and opens it in StackBlitz via browser WebContainers.
 */
export function exportToStackBlitz(title: string, description: string, reactCode: string) {
  const appCode = ensureLucideImports(reactCode);

  sdk.openProject({
    title: title,
    description: description,
    template: 'node',
    files: {
      'package.json': JSON.stringify({
        name: 'bridgeview-dashboard',
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'tsc -b && vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.3.1',
          'react-dom': '^18.3.1',
          'lucide-react': '^0.344.0'
        },
        devDependencies: {
          vite: '^5.4.1',
          '@vitejs/plugin-react': '^4.3.1',
          tailwindcss: '^4.0.0-beta.8',
          '@tailwindcss/vite': '^4.0.0-beta.8',
          typescript: '^5.5.3',
          '@types/react': '^18.3.3',
          '@types/react-dom': '^18.3.0'
        }
      }, null, 2),
      'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});`,
      'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      'src/main.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);`,
      'src/index.css': `@import "tailwindcss";

html, body, #root {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background-color: #0b132b;
  color: #f3f4f6;
  font-family: ui-sans-serif, system-ui, sans-serif;
}`,
      'src/App.tsx': appCode,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['DOM', 'DOM.Iterable', 'ES2020'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true
        },
        include: ['src']
      }, null, 2)
    }
  }, {
    newWindow: true,
    openFile: 'src/App.tsx',
    startScript: 'dev'
  });
}
