// vite.config.js
export default {
  // don't allow automatic port switching as we need to know the port
  server: {
    strictPort: true,
    // host: "0.0.0.0",
    host: true,
    allowedHosts: true
  },
  preview: {
    allowedHosts: ['trycloudflare.com'],
  },
  root: "src",
  build: {
    outDir: "../build",
  },
  publicDir: "../public",
};
