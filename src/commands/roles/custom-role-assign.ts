import { Message } from 'discord.js';
import logger from '../../helpers/logger';
import Command from '../command-interface';

export const CustomRole: Command = {
  name: 'giverole',
  aliases: null,
  description: 'Give yourself a role and colour',
  help: 'giverole <Role Name>, <#hexcolour>',
  hidden: false,
  admin: false,
  function: run,
};

const hexRegex = /#(?:[0-9a-fA-F]{3}){1,2}/;

async function run(message: Message): Promise<void> {
  const splitMsg = message.content.split(',');
  const guild = message.guild;

  const authorMember = await guild.members.fetch(message.author.id);
  if (message.mentions.roles.size) {
    const roleToAdd = message.mentions.roles.first();
    authorMember.roles
      .add(roleToAdd)
      .then(() => {
        message.react('✅');
      })
      .catch((err) => logger.warn(err));
    return;
  }

  if (splitMsg.length < 1 || !splitMsg[0].length) {
    message.reply('Invalid command usage').catch((err) => logger.warn(err));
    return;
  }

  const roleName = splitMsg[0].trim().substring(0, 100);
  let hexColour: string;

  if (splitMsg[1]) {
    const findHex = splitMsg[1].match(hexRegex);
    if (findHex) {
      hexColour = findHex[0];
    }
  }

  guild.roles
    .create({
      name: roleName,
      hoist: true,
      color: hexColour ? `#${hexColour.substring(1)}` : undefined,
    })
    .then((role) => {
      authorMember.roles.add(role).then(() => message.react('✅'));
    })
    .catch((err) => {
      message.reply('There was an error creating your role');
      logger.warn(err);
    });
}
