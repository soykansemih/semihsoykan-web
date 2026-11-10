import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('preload-helper') || id.includes('commonjsHelpers')) return 'react';
              if (!id.includes('node_modules')) return;
              if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react';
              if (id.includes('node_modules/three/')) return 'three';
              if (id.includes('@emailjs')) return 'emailjs';
              return 'scene-vendor';
            },
          },
        },
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
