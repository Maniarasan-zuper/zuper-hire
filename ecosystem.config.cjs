module.exports = {
  apps: [
    {
      name: 'zuper-hire',
      script: 'node_modules/.bin/next',
      args: 'start --port 3131',
      env: {
        NODE_ENV: 'production',
        PORT: 3131,
      },
      watch: false,
      autorestart: true,
    },
  ],
};
