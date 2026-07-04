import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(async () => {
  const plugins = [react()];
  let tailwindActive = false;

  try {
    // @ts-ignore
    const tailwind = await import('@tailwindcss/vite');
    plugins.push(tailwind.default());
    tailwindActive = true;
  } catch (e) {
    console.warn("Tailwind CSS v4 is not installed locally. Skipping compilation.");
  }

  // If Tailwind is not active, strip the import directive to prevent PostCSS import resolution crashes
  if (!tailwindActive) {
    plugins.push({
      name: 'local-tailwind-stripper',
      async load(id: string) {
        if (id.includes('index.css') && !id.includes('?')) {
          const fs = await import('fs');
          const code = fs.readFileSync(id, 'utf-8');
          return code.replace(/@import\s+["']tailwindcss["'];?/g, '');
        }
        return null;
      }
    } as any);
  }

  return {
    plugins,
  };
})
