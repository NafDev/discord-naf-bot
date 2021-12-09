import {
  GuildEmoji,
  GuildMember,
  Message,
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  ReactionEmoji,
  Role,
  User,
} from 'discord.js';
import { MD5 as hashObj } from 'object-hash';
import { SelfRole } from '../../db/models/selfrole.schema';
import logger from '../../helpers/logger';
import { parseEmoji, UNICODE_EMOJI } from '../../helpers/parsers';

export class RoleAssignManager {
  rules: Map<
    string,
    {
      addRole: (arg0: MessageReaction | PartialMessageReaction, arg1: User | PartialUser) => Promise<void>;
      removeRole: (arg0: MessageReaction | PartialMessageReaction, arg1: User | PartialUser) => Promise<void>;
    }
  >;

  private static instance: RoleAssignManager;

  public static getInstance(): RoleAssignManager {
    if (!RoleAssignManager.instance) {
      RoleAssignManager.instance = new RoleAssignManager();
    }

    return RoleAssignManager.instance;
  }

  private constructor() {
    this.rules = new Map();
  }

  addRule(message: Message, role: Role, emoji: string | GuildEmoji): void {
    const client = message.client;
    const targetMessageId = message.id;

    const schema: SelfRole = {
      channelId: message.channel.id,
      messageId: targetMessageId,
      roleId: role.id,
      emojiId: typeof emoji === 'string' ? emoji : emoji.id,
    };

    if (this.rules.has(hashObj(schema))) {
      logger.warn(`Role assign rule is already registered: ${JSON.stringify(schema, null, 2)}`);
      return;
    }

    const listeners = {
      addRole: addRoleListener(targetMessageId, emoji, role),
      removeRole: removeRoleListener(targetMessageId, emoji, role),
    };
    this.rules.set(hashObj(schema), listeners);

    client.setMaxListeners(client.getMaxListeners() + 1);

    client.on('messageReactionAdd', listeners.addRole);
    client.on('messageReactionRemove', listeners.removeRole);

    logger.info(`Added role assign rule: ${JSON.stringify(schema, null, 2)}`);
  }

  removeRule(message: Message, role: Role, emoji: string | GuildEmoji): void {
    const client = message.client;
    const targetMessageId = message.id;

    const schema: SelfRole = {
      channelId: message.channel.id,
      messageId: targetMessageId,
      roleId: role.id,
      emojiId: typeof emoji === 'string' ? emoji : emoji.id,
    };

    const listeners = this.rules.get(hashObj(schema));

    if (listeners !== undefined) {
      client.setMaxListeners(client.getMaxListeners() - 1);

      client.off('messageReactionAdd', listeners.addRole);
      client.off('messageReactionRemove', listeners.removeRole);

      this.rules.delete(hashObj(schema));
      logger.info(`Removed role assign rule: ${JSON.stringify(schema, null, 2)}`);
    }
  }
}

const addRoleListener =
  (targetMessageId: string, emoji: string | GuildEmoji, role: Role) =>
  async (messageReaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
    const member = await getMember(messageReaction, user, targetMessageId, emoji);
    if (member !== null) {
      member.roles
        .add(role)
        .then(() => logger.info(`Role assign: added "${role.name}" // "${member.id}"`))
        .catch((err) => logger.error(err));
    }
  };

const removeRoleListener =
  (targetMessageId: string, emoji: string | GuildEmoji, role: Role) =>
  async (messageReaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
    const member = await getMember(messageReaction, user, targetMessageId, emoji);
    if (member !== null) {
      member.roles
        .remove(role)
        .then(() => logger.info(`Role assign: removed "${role.name}" // "${member.id}"`))
        .catch((err) => logger.error(err));
    }
  };

async function getMember(
  messageReaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser,
  targetMessageId: string,
  emoji: string | GuildEmoji
): Promise<GuildMember | null> {
  if (user.id === messageReaction.message.client.user?.id) return null;
  if (messageReaction.message.id !== targetMessageId) return null;

  if (messageReaction.partial) {
    messageReaction = await messageReaction.fetch();
  }

  if (messageReaction.emoji instanceof GuildEmoji && messageReaction.emoji !== emoji) {
    return null;
  } else if (messageReaction.emoji instanceof ReactionEmoji && messageReaction.emoji.name !== emoji) {
    return null;
  }

  let guild = messageReaction.message.guild;
  if (guild === null) {
    messageReaction.message = await messageReaction.message.fetch(true);
    guild = messageReaction.message.guild;
    if (guild === null) return null;
  }

  const member = await guild.members.fetch(user instanceof User ? user : await user.fetch());
  return member || null;
}

export function validateRoleAssignCommand(message: Message): null | {
  messageId: string;
  role: Role;
  emoji: string | GuildEmoji;
} {
  const role = message.mentions.roles.first();

  if (role === undefined) {
    message.reply('Could not find a mentioned role in your message');
    return null;
  }

  const findUnicode = message.content.match(UNICODE_EMOJI);
  let emoji: string | GuildEmoji | null;

  if (findUnicode === null) {
    emoji = parseEmoji(message.content, message);
  } else {
    emoji = findUnicode[0];
  }

  if (emoji === null) {
    message.reply(
      'Could not find an emoji in your message. If using a custom emoji, it must belong to this server (no nitro emojis)'
    );
    return null;
  }

  const messageRegex = message.content.match(/(?<!@|&|:)\d{18}/);
  if (messageRegex === null) {
    message.reply("Couldn't find a message ID from your message");
    return null;
  }

  const messageId = messageRegex[0];

  return {
    messageId,
    role,
    emoji,
  };
}
