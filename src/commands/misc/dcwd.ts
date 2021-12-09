import { Message } from 'discord.js';
import Command from '../command-interface';
import dcwd from './dcwordoftheday';

async function don(message: Message): Promise<void> {
  message.channel.sendTyping();

  let bottomtext = message.cleanContent;

  const matchEmoji = new RegExp(/<a?:([a-zA-Z0-9_]+):?[0-9]+>?/);
  let found = null;
  do {
    found = bottomtext.match(matchEmoji);
    if (found) {
      bottomtext = bottomtext.replace(matchEmoji, found[1]);
    }
  } while (found !== null);

  bottomtext = bottomtext.replace(/[^\S ]+/g, '').replace(/ {2,}/g, ' ');
  if (bottomtext.trim().length) {
    const image = await dcwd(bottomtext);
    message.channel.send({ files: [image] });
  }
}

export const WordOfTheDay: Command = {
  name: 'dcwd',
  aliases: ['don', 'doncheadle'],
  description: "What is Don Cheadle's Word of the Day?",
  help: null,
  hidden: false,
  admin: false,
  function: don,
};
