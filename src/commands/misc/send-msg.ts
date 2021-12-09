import { DMChannel, Message } from 'discord.js';
import { DISCORD_SNOWFLAKE } from '../../db/common-validators';
import logger from '../../helpers/logger';
import Command from '../command-interface';

async function sendMsg(message: Message): Promise<Message> {
  const channel = message.channel;
  if (!(channel instanceof DMChannel)) return;

  const targetChannelMatch = message.content.match(DISCORD_SNOWFLAKE);
  if (!targetChannelMatch) return message.reply("Can't find a channel ID");

  const targetChannel = await message.client.channels.fetch(targetChannelMatch[0]).catch((e) => {
    logger.warn(e);
  });

  if (!targetChannel || !targetChannel.isText()) return message.reply("This isn't a text channel.");
  message.reply('Text channel found, type your message...');
  const filter = (m: Message) => m.author === message.author;
  channel
    .awaitMessages({ filter, max: 1, time: 30000 })
    .then((msgs) => {
      const msg = msgs.first();
      targetChannel.send(msg.content).then(() => {
        message.reply(`Sent ghost message to channel ${targetChannel.id}`);
      });
      logger.info(`Sent ghost message to channel ${targetChannel.id}`);
    })
    .catch(() => message.reply('Time expired!'));
}

export const SendMessage: Command = {
  name: 'sendmsg',
  aliases: null,
  description: null,
  help: null,
  hidden: true,
  admin: true,
  function: sendMsg,
};
