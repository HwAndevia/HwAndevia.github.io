import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import sitemap from 'vite-plugin-sitemap';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    // Mantén '/' si configuraste un dominio personalizado o si despliegas 
    // la rama principal directamente a hwandevia.github.io.
    base: '/',

    plugins: [
      react(), 
      tailwindcss(),
      // Configuración automatizada del sitemap
      sitemap({
        hostname: 'https://hwandevia.github.io',
        // Opcional: Genera automáticamente un archivo robots.txt básico
        generateRobotsTxt: true, 
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      strictPort: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
