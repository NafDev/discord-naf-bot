import { GuildEmoji, Message } from 'discord.js';
import { SelfRoleModel } from '../../db/models/selfrole.schema';
import Command from '../command-interface';
import { RoleAssignManager, validateRoleAssignCommand } from './role-assign-manager';

async function removeRoleAssign(message: Message): Promise<void> {
  const values = validateRoleAssignCommand(message);
  if (values === null) return;

  const messageId = values.messageId;
  const emoji = values.emoji;
  const role = values.role;
  const emojiConst = emoji instanceof GuildEmoji ? emoji.id : emoji;

  message.channel.messages
    .fetch(messageId)
    .then(async (message) => {
      RoleAssignManager.getInstance().removeRule(message, role, emoji);
      message.react(emoji).then((res) => res.remove());
      SelfRoleModel.findOneAndDelete({
        channelId: message.channel.id,
        messageId: messageId,
        roleId: role.id,
        emojiId: emojiConst,
      }).exec();
    })
    .catch(() => message.author.send(`Can't find message: ${messageId}`));
}

export const RemoveRoleAssign: Command = {
  name: 'removeselfrole',
  aliases: null,
  description: null,
  help: null,
  hidden: true,
  admin: true,
  function: removeRoleAssign,
};
