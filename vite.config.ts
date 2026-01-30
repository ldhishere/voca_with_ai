
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // 빌드 시점에 환경 변수를 주입합니다.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  // 중요: GitHub Pages 주소가 'https://<username>.github.io/<repo-name>/' 형식이면 
  // base에 '/<repo-name>/'을 입력해야 합니다.
  base: './' 
});
