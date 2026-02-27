module.exports = {
  apps: [
    {
      name: "tsukytales",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "/home/ubuntu/tsukytales/tsukytales",
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "2G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      kill_timeout: 5000,
      listen_timeout: 10000,
      error_file: "/var/log/pm2/tsukytales-error.log",
      out_file: "/var/log/pm2/tsukytales-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
