import axios from 'axios';
import { Message } from 'discord.js';
import logger from '../../helpers/logger';
import Command from '../command-interface';

export const InspirationQuote: Command = {
  name: 'inspire',
  aliases: ['jj', 'quote'],
  description: 'AI-generated inspirational quotes',
  help: null,
  hidden: false,
  admin: false,
  function: run,
};

async function run(message: Message): Promise<void> {
  const res = await axios.get('https://inspirobot.me/api?generate=true').catch((e) => {
    logger.warn(e);
    return undefined;
  });
  if (res) {
    message.channel.send(res.data);
  }
}
