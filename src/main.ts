import Discord from 'discord.js';
import { config } from './config';
import logger from './helpers/logger';
import { startup } from './startup';

const { DISCORD_PREFIX, DISCORD_TOKEN, DISCORD_ID } = config;

if (config.TZ !== 'Europe/London') {
  logger.info('Setting TZ to Europe/London');
  config.TZ = 'Europe/London';
}

const client = new Discord.Client({
  intents: [
    'DIRECT_MESSAGES',
    'GUILDS',
    'GUILD_EMOJIS_AND_STICKERS',
    'GUILD_MESSAGE_REACTIONS',
    'GUILD_MESSAGES',
    'GUILD_MEMBERS',
  ],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER'],
});

client.once('ready', () => {
  logger.info('Connected to Discord');
  if (DISCORD_ID === undefined) throw new Error('DISCORD_ID is undefined');
  client.users.fetch(DISCORD_ID).then((me) => {
    logger.info(`Fetched author ${me.tag}`);
    startup(client, me);
  });

  client.user.setActivity(`reactions | ${DISCORD_PREFIX}help`, { type: 'WATCHING' });
});

client.login(DISCORD_TOKEN);
