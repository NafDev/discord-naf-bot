import { GuildMember, Message, MessageEmbed } from 'discord.js';
import { ReactionModel } from '../../db/models/reaction.schema';
import logger from '../../helpers/logger';
import { parseEmoji, UNICODE_EMOJI } from '../../helpers/parsers';
import Command from '../command-interface';

async function serverFarm(message: Message): Promise<Message | void> {
  if (message.guild === null) return;

  let emojiId = null;
  let guildEmoji = null;

  const unicodeEmoji = message.content.match(UNICODE_EMOJI);

  if (unicodeEmoji !== null) {
    emojiId = unicodeEmoji[0];
  } else {
    guildEmoji = parseEmoji(message.content, message);
    emojiId = guildEmoji?.id;
  }

  if (typeof emojiId !== 'string') {
    return message.channel.send('I only work with default emojis, or custom emojis from this server.');
  }

  const queryCursor = ReactionModel.find()
    .where({
      serverId: message.guild.id,
      emojiId: emojiId,
    })
    .sort({ count: 'desc' })
    .cursor();

  const embed = new MessageEmbed();
  if (guildEmoji !== null) {
    embed.setTitle(`Top ${guildEmoji.name} Farmers`);
    embed.setThumbnail(guildEmoji.url);
  } else {
    embed.setTitle(`Top ${emojiId} Farmers`);
  }
  embed.setColor(message.member.displayHexColor || 'RANDOM');

  for (let doc = await queryCursor.next(), i = 0; i < 5; doc = await queryCursor.next()) {
    if (doc === null) break;

    const user: GuildMember | null = await message.guild.members.fetch(doc.userId).catch((e) => {
      logger.warn(e);
      return null;
    });
    if (!user || doc.count === 0) continue;

    embed.addField(`${i + 1}. with ${doc.count} reactions`, `farmed by ${user}`, false);
    i++;
  }

  if (embed.fields.length === 0) {
    return message.channel.send(`Nobody has recieved any ${guildEmoji || emojiId} reactions.`);
  }

  const totalCount = await ReactionModel.aggregate()
    .match({ serverId: message.guildId, emojiId })
    .group({ _id: null, total: { $sum: '$count' } })
    .exec();

  if (totalCount && totalCount[0]) {
    embed.setFooter('Total reactions: ' + totalCount[0].total);
  }

  return message.channel.send({ embeds: [embed] });
}

export const ServerFarm: Command = {
  name: 'serverfarm',
  aliases: ['server', 'emoji'],
  description: 'Find the top 5 farmers of an emoji',
  help: 'server <emoji>',
  hidden: false,
  admin: false,
  function: serverFarm,
};
