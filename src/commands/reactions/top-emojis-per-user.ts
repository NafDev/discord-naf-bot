import { GuildEmoji, Message, MessageEmbed } from 'discord.js';
import { ReactionModel } from '../../db/models/reaction.schema';
import logger from '../../helpers/logger';
import { parseGuildMember } from '../../helpers/parsers';
import Command from '../command-interface';

async function userFarm(message: Message): Promise<Message | void> {
  if (message.guild === null) return;

  let user = await parseGuildMember(message.content, message);
  if (user === null) {
    user = await message.guild.members.fetch(message.author.id);
  }

  const queryCursor = ReactionModel.find()
    .where({
      serverId: message.guild.id,
      userId: user.id,
    })
    .sort({ count: 'desc' })
    .cursor();

  const embed = new MessageEmbed();
  embed.setTitle(`${user.displayName}'s React Farm`);
  embed.setColor(user.displayHexColor || 'RANDOM');

  for (let doc = await queryCursor.next(), i = 0; i < 5; doc = await queryCursor.next()) {
    if (doc === null) break;

    let emoji: string | GuildEmoji = doc.emojiId;
    if (!emoji.match(/\p{Emoji_Presentation}/gu)) {
      emoji = await message.guild.emojis.fetch(emoji).catch((err) => {
        logger.warn(err);
        return null;
      });
      if (emoji === null) continue;
    }
    if (doc.count === 0) continue;
    embed.addField(`${i + 1}. ${emoji}`, `with ${doc.count} farmed reacts`, false);

    i++;
  }

  if (embed.fields.length === 0) {
    return message.channel.send(`${user} has not recieved any reactions.`);
  }

  embed.setTitle(`${user.displayName}'s React Farm`);
  embed.setColor(user.displayHexColor);
  embed.setThumbnail(user.user.displayAvatarURL({ dynamic: true }));
  return message.channel.send({ embeds: [embed] });
}

export const UserFarm: Command = {
  name: 'userfarm',
  aliases: ['user'],
  description: 'Find the top 5 emojis for a user',
  help: 'user @mentionUser',
  hidden: false,
  admin: false,
  function: userFarm,
};
