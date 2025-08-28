// vite.config.js
export default {
  root: '.',
  publicDir: 'public',
  server: {
    host: '0.0.0.0',
    port: 3232,
    strictPort: true,
  },
  preview: {
    allowedHosts: ['mr-narrative-space-explorer.onrender.com'],
    port: 5005
  }
};
