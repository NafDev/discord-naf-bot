import { Client, Message } from 'discord.js';
import { RoleAssignManager } from '../commands/roles/role-assign-manager';
import { SelfRoleModel } from '../db/models/selfrole.schema';
import logger from '../helpers/logger';
import { UNICODE_EMOJI } from '../helpers/parsers';
import BotEvent from './event-interface';

export const event: BotEvent = {
  name: 'register-selfroles',
  function: run,
};

async function run(client: Client): Promise<void> {
  logger.info('Registering existing self role-assign rules...');

  const roleAssignManager = RoleAssignManager.getInstance();

  const cursor = SelfRoleModel.find().cursor();

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    const channel = await client.channels.fetch(doc.channelId);

    if (channel === null) {
      logger.warn(`Cannot find a channel with ID ${doc.channelId}`);
      continue;
    }

    const guild = client.guilds.cache.find((guild) => guild.channels.cache.has(channel.id));

    if (guild === undefined) {
      logger.warn(`Cannot find a guild containing channel ${doc.channelId}`);
      continue;
    }

    if (guild.me?.permissions.has('MANAGE_ROLES') === false) {
      logger.warn(`Bot doesn't have MANAGE ROLES permissions in guild: ${guild.name}`);
      continue;
    }

    const role = await guild.roles.fetch(doc.roleId);

    if (role === null) {
      logger.warn(`Cannot find role ${doc.roleId} in guild ${guild.name}`);
      continue;
    }

    const guildChannel = guild.channels.cache.find((x) => x.id === channel.id);
    let message;

    if (guildChannel?.isText()) {
      message = await guildChannel.messages.fetch(doc.messageId).catch(() => {
        logger.warn(`Unknown message: ${doc.messageId} -- Deleting doc from DB...`);
        doc.delete().exec();
      });

      if (!(message instanceof Message)) continue;
    } else {
      continue;
    }

    if (!doc.emojiId.match(UNICODE_EMOJI)) {
      const emoji = guild.emojis.cache.find((x) => x.id === doc.emojiId);
      if (emoji === undefined) {
        logger.warn(`Cannot find guild emoji ${doc.emojiId} in guild ${guild.name}`);
        continue;
      } else {
        roleAssignManager.addRule(message, role, emoji);
      }
    } else {
      roleAssignManager.addRule(message, role, doc.emojiId);
    }
  }
  logger.info('Finished registering self role-assign rules');
}
