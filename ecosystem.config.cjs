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
        // VPS may route outbound HTTPS via a local proxy (e.g. 127.0.0.1:8118).
        // IPPanel Edge API returns 502 through that proxy — bypass it for ippanel.com.
        NO_PROXY: "localhost,127.0.0.1,::1,edge.ippanel.com,ippanel.com",
        no_proxy: "localhost,127.0.0.1,::1,edge.ippanel.com,ippanel.com",
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      watch: false,
      max_memory_restart: "512M",
    },
  ],
};
