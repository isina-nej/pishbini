module.exports = {
  apps: [
    {
      name: "pishbini",
      cwd: __dirname,
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        // VPS often has a global HTTPS proxy (127.0.0.1:8118). IPPanel returns 502 via that exit IP.
        // Clear proxy for this app so outbound SMS uses the VPS IP directly.
        HTTP_PROXY: "",
        HTTPS_PROXY: "",
        http_proxy: "",
        https_proxy: "",
        ALL_PROXY: "",
        all_proxy: "",
        NO_PROXY: "localhost,127.0.0.1,::1,edge.ippanel.com,ippanel.com,.ippanel.com",
        no_proxy: "localhost,127.0.0.1,::1,edge.ippanel.com,ippanel.com,.ippanel.com",
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      watch: false,
      max_memory_restart: "512M",
    },
  ],
};
