module.exports = {
  apps: [
    {
      name: 'naf-bot',
      script: 'dist/main.js',
      node_args: '-r dotenv/config',
      args: 'dotenv_config_path=~/naf-bot-prod.env',
      env_production: {
        NODE_ENV: 'production',
        DISCORD_PREFIX: '%',
      },
    },
  ],
};
