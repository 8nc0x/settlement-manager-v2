module.exports = {
  apps: [
    {
      name: 'settletrack',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 0.0.0.0 -p 3001',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0'
      }
    }
  ]
};
