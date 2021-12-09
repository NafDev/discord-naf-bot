import { Message } from 'discord.js';
import { config } from '../../config';
import logger from '../../helpers/logger';
import Command from '../command-interface';

const ENV = config.NODE_ENV;
const VER = config.APP_VERSION;

async function ping(message: Message): Promise<Message> {
  if (message.author.id === config.DISCORD_ID) {
    logger.info(message.content ? `Ping: ${message.content}` : 'Ping');
    if (config.APP_VERSION && message.content.trim() === 'ver') {
      message.channel.send(`Pong \`${ENV === 'production' ? 'v' + VER : 'dev v' + VER}\``);
      return;
    }
  }

  if (message.content.length !== 0) {
    message.channel.send(message.content);
  } else {
    message.channel.send('Pong');
  }
}

export const Ping: Command = {
  name: 'ping',
  aliases: null,
  description: 'Ping',
  help: null,
  hidden: true,
  admin: false,
  function: ping,
};
