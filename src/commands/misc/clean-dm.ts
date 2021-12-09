import { Message } from 'discord.js';
import logger from '../../helpers/logger';
import scrapeMessages from '../../helpers/message-scraper';
import Command from '../command-interface';

async function cleanDmChannel(message: Message): Promise<void> {
  const client = message.client;
  scrapeMessages(message.channel, (message) => {
    if (message.author.id === client.user?.id) {
      message.delete().catch((err) => logger.error(err));
    }
  });
}

export const CleanDMChannel: Command = {
  name: 'clean',
  aliases: null,
  description: null,
  help: null,
  hidden: true,
  admin: true,
  function: cleanDmChannel,
};
