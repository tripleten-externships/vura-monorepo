import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const env = loadEnv('', process.cwd(), '');

const deploymentEnv = env.DEPLOYMENT_ENV || 'local';
const viteApiUrl = env.VITE_API_URL || 'http://localhost:3001';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      'react-native': path.resolve(__dirname, 'src/shims/react-native-web.ts'),
    },
  },
  define: {
    global: 'globalThis',
    'process.env.DEPLOYMENT_ENV': `'${deploymentEnv}'`,
    VITE_API_URL: `'${viteApiUrl}'`,
    'process.env.NODE_ENV': `'${deploymentEnv === 'local' ? 'development' : 'production'}'`,
  },
  optimizeDeps: {
    include: ['react-native-web'],
  },
});
