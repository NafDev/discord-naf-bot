import { Message, Role } from 'discord.js';
import logger from '../../helpers/logger';
import Command from '../command-interface';

export const RemoveCustomRole: Command = {
  name: 'removerole',
  aliases: null,
  description: 'Remove a role',
  help: 'removerole <@role>',
  hidden: false,
  admin: false,
  function: run,
};

async function run(message: Message): Promise<void> {
  const roleToRemove: Role = message.mentions.roles.first();

  if (!roleToRemove) {
    return;
  }

  const member = await message.guild.members.fetch(message.author.id);
  if (!member) {
    return;
  }

  const authorMember = await message.guild.members.fetch(message.author.id);
  await authorMember.roles
    .remove(roleToRemove)
    .then(() => {
      message.react('✅');
    })
    .catch((err) => logger.warn(err));

  const role = await message.guild.roles.fetch(roleToRemove.id);

  if ((role.members.size === 1 && role.members.first().id === message.author.id) || role.members.size === 0) {
    role.delete().catch((err) => logger.warn(err));
  }
}
