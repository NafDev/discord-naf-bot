import { Message, Role } from 'discord.js';
import logger from '../../helpers/logger';
import { extractString } from '../../helpers/util';
import Command from '../command-interface';

export const AddCustomRole: Command = {
  name: 'giverole',
  aliases: null,
  description: 'Give yourself a role and colour',
  help: 'giverole <Role Name> <#hexcolour>',
  hidden: false,
  admin: false,
  function: run,
};

const hexRegex = /#(?:[0-9a-fA-F]{3}){1,2}/;

async function run(message: Message): Promise<void> {
  let cmdString = message.content;
  let roleName: string;
  const hexColour = extractString(hexRegex, cmdString);
  if (hexColour) {
    cmdString = cmdString.replace(hexColour, '').trim();
  }

  if (cmdString.lastIndexOf(',') === cmdString.length - 1) {
    roleName = cmdString.slice(0, -1);
  } else {
    roleName = cmdString;
  }

  if (!roleName) {
    message.reply('Invalid command usage: No role name found').catch((err) => logger.warn(err));
    return;
  }

  const guild = message.guild;
  const authorMember = await guild.members.fetch(message.author.id);

  let roleToAdd: Role;
  if (message.mentions.roles.size) {
    roleToAdd = message.mentions.roles.first();
  } else {
    const existingRole = guild.roles.cache.find((x) => x.name.toLowerCase() === roleName && x.mentionable);
    if (!existingRole) {
      roleToAdd = existingRole;
    }
  }

  if (!roleToAdd) {
    roleToAdd = await guild.roles.create({
      name: roleName,
      hoist: true,
      mentionable: true,
      color: hexColour ? `#${hexColour.substring(1)}` : undefined,
    });
  }

  authorMember.roles
    .add(roleToAdd)
    .then(() => message.react('✅'))
    .catch((err) => logger.warn(err));
}
