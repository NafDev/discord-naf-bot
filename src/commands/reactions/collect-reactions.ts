import { GuildEmoji, Message } from 'discord.js';
import has from 'lodash.has';
import set from 'lodash.set';
import { Reaction, ReactionModel } from '../../db/models/reaction.schema';
import logger from '../../helpers/logger';
import scrapeMessages from '../../helpers/message-scraper';
import { UNICODE_EMOJI } from '../../helpers/parsers';
import Command from '../command-interface';

interface reactionDataObj {
  [emoji: string]: {
    [user: string]: number;
  };
}

async function collectReactions(message: Message): Promise<void> {
  const guild = message.guild;
  if (guild === null) return;

  const startMsg = `Started message collection in "${guild.name}"`;
  logger.info(startMsg);
  message.author.send(`\`${startMsg}\``);

  let totalProcessed = 0;
  const start = new Date();

  const data: reactionDataObj = {};

  for (const [, channel] of await guild.channels.fetch()) {
    if (channel.isText() && channel.viewable) {
      totalProcessed += await scrapeMessages(channel, (message) => {
        for (const [, reaction] of message.reactions.cache) {
          if (
            reaction.emoji.name &&
            (reaction.emoji instanceof GuildEmoji || reaction.emoji.name.match(UNICODE_EMOJI))
          ) {
            const e = reaction.emoji instanceof GuildEmoji ? reaction.emoji.id : reaction.emoji.name;
            const u = reaction.message.author?.id;
            const newCount = reaction.count || 0;

            if (u === undefined) continue;

            if (has(data, `${e}.${u}`)) {
              data[e][u] += newCount;
            } else {
              set(data, `${e}.${u}`, newCount);
            }
          }
        }
      });
    }
  }

  const time = new Date(new Date().valueOf() - start.valueOf());
  const endMsg = `Processed ${totalProcessed} messages in ${time.toISOString().substr(11, 8)}`;
  logger.info(endMsg);

  message.author.send(`\`${endMsg}\``);

  const models: Reaction[] = [];
  for (const [emoji, userData] of Object.entries(data)) {
    for (const [user, count] of Object.entries(userData)) {
      models.push({
        serverId: guild.id,
        emojiId: emoji,
        userId: user,
        count,
      });
    }
  }

  ReactionModel.collection
    .bulkWrite(
      models.map((model) => ({
        updateOne: {
          filter: { server: model.serverId, user: model.userId, emoji: model.emojiId },
          update: { $set: model },
          upsert: true,
        },
      }))
    )
    .then((res) => logger.info('Upserted reaction documents: ' + res.upsertedCount))
    .catch((err) => logger.error(err));
}

export const CollectReactions: Command = {
  name: 'collect',
  aliases: null,
  description: null,
  help: null,
  hidden: true,
  admin: true,
  function: collectReactions,
};
