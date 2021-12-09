import { GuildEmoji, Message, MessageEmbed, Role } from 'discord.js';
import set from 'lodash.set';
import { SelfRoleModel } from '../../db/models/selfrole.schema';
import logger from '../../helpers/logger';
import { UNICODE_EMOJI } from '../../helpers/parsers';
import Command from '../command-interface';

async function viewRoleAssignRules(message: Message): Promise<void> {
  const rules = await SelfRoleModel.find({ channelId: message.channelId });

  if (rules.length === 0) {
    message.reply('There are no emoji rules in this message channel');
    return;
  }

  const ruleList: {
    [messageId: string]: {
      [roleId: string]: string | GuildEmoji;
    };
  } = {};

  for (const rule of rules) {
    const msg: Message | void = await message.channel.messages.fetch(rule.messageId).catch((err) => {
      logger.warn(`Error finding message ID ${rule.messageId} with error "${err}", skipping...`);
    });
    if (!(msg instanceof Message)) continue;

    const role = await message.guild?.roles.fetch(rule.roleId);
    if (!(role instanceof Role)) {
      logger.warn(`Error finding role ID ${rule.roleId}, skipping...`);
      continue;
    }

    let emoji: GuildEmoji | string = rule.emojiId;

    if (!emoji.match(UNICODE_EMOJI)) {
      emoji =
        (await message.guild?.emojis.fetch(rule.emojiId).catch((err) => {
          logger.warn(`Error finding emoji ID ${rule.emojiId} with error "${err}", skipping...`);
        })) || '';
      if (emoji === '') {
        logger.warn(`Error finding guild emoji ID ${rule.emojiId}, skipping...`);
        continue;
      }
    }

    set(ruleList, `${msg.id}.${role.id}`, emoji);
  }

  const embeds: MessageEmbed[] = [];

  for (const [messageId, rolesEmojis] of Object.entries(ruleList)) {
    const embed = new MessageEmbed();
    embed.setTitle(`https://discord.com/channels/${message.guildId}/${message.channelId}/${messageId}`);
    for (const [role, emoji] of Object.entries(rolesEmojis)) {
      embed.addField('\u200B', `${emoji}  ${message.guild?.roles.cache.get(role) || ''}`, true);
    }
    embeds.push(embed);
  }

  message.reply({ embeds });
}

export const ViewRoleRules: Command = {
  name: 'viewselfroles',
  aliases: null,
  description: null,
  help: null,
  hidden: true,
  admin: true,
  function: viewRoleAssignRules,
};
