import { Client, GuildEmoji, MessageReaction, PartialMessageReaction } from 'discord.js';
import { ReactionModel } from '../db/models/reaction.schema';
import logger from '../helpers/logger';
import { UNICODE_EMOJI } from '../helpers/parsers';
import BotEvent from './event-interface';

export const event: BotEvent = {
  name: 'watching-reactions',
  function: run,
};

async function run(client: Client): Promise<void> {
  client.on('messageReactionAdd', async function logReactionAdd(m) {
    const res = await logReaction(m);
    if (res === null) return;

    ReactionModel.findOneAndUpdate(
      { serverId: res.server.id, userId: res.user.id, emojiId: res.emojiId },
      { $inc: { count: 1 } },
      { upsert: true }
    )
      .exec()
      .catch((e) => logger.error(e));
  });

  client.on('messageReactionRemove', async function logReactionRemove(m) {
    const res = await logReaction(m);
    if (res === null) return;

    ReactionModel.findOneAndUpdate(
      { serverId: res.server.id, userId: res.user.id, emojiId: res.emojiId },
      { $inc: { count: -1 } }
    )
      .exec()
      .catch((e) => logger.error(e));
  });
}

async function logReaction(messageReaction: MessageReaction | PartialMessageReaction) {
  if (messageReaction.partial) {
    messageReaction = await messageReaction.fetch().catch((e) => {
      logger.warn(e);
      return null;
    });
    if (messageReaction === null) return null;
  }

  const server = messageReaction.message.guild;
  const user = messageReaction.message.author;
  const emojiId =
    messageReaction.emoji instanceof GuildEmoji
      ? messageReaction.emoji.id
      : messageReaction.emoji.name?.match(UNICODE_EMOJI)
      ? messageReaction.emoji.name
      : null;

  if (server === null || user === null || emojiId === null) return null;

  return {
    server,
    user,
    emojiId,
  };
}
