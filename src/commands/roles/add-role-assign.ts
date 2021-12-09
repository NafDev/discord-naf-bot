import { GuildEmoji, Message } from 'discord.js';
import { SelfRoleModel } from '../../db/models/selfrole.schema';
import Command from '../command-interface';
import { RoleAssignManager, validateRoleAssignCommand } from './role-assign-manager';

async function addRoleAssign(message: Message): Promise<void> {
  const values = validateRoleAssignCommand(message);
  if (values === null) return;

  const messageId = values.messageId;
  const emoji = values.emoji;
  const role = values.role;

  const emojiString = emoji instanceof GuildEmoji ? emoji.id : emoji;

  const query = await SelfRoleModel.findOne({
    channelId: message.channel.id,
    messageId: messageId,
    roleId: role.id,
    emojiId: emojiString,
  }).exec();

  if (query !== null) {
    message.reply('This rule already exists.');
    return;
  }

  message.channel.messages
    .fetch(messageId)
    .then(async (message) => {
      if (emoji === null) return;
      message = await message.fetch();
      message.react(emojiString);
      RoleAssignManager.getInstance().addRule(message, role, emoji);
      SelfRoleModel.create({
        channelId: message.channel.id,
        messageId: messageId,
        roleId: role.id,
        emojiId: emojiString,
      });
    })
    .catch(() => message.author.send(`Can't find message: ${messageId}`));
}

export const AddRoleAssign: Command = {
  name: 'addselfrole',
  aliases: null,
  description: null,
  help: null,
  hidden: true,
  admin: true,
  function: addRoleAssign,
};
