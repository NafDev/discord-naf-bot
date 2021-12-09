/* eslint-disable @typescript-eslint/no-explicit-any */
import { GuildEmoji, GuildMember, Message } from 'discord.js';
import { config } from '../config';
import logger from './logger';
const PREFIX = config.DISCORD_PREFIX;

export const UNICODE_EMOJI = /\p{Emoji_Presentation}+/gu;

export function parseEmoji(value: string, msg: Message): GuildEmoji | null {
  const matches = value.match(/(?:<a?:([a-zA-Z0-9_]+):)([0-9]+)>?/);
  try {
    if (matches !== null) return msg.client.emojis.cache.get(matches[2]) || null;
  } catch (error) {
    logger.error(error);
  }
  const search = value.toLowerCase();
  const emojis = msg.guild?.emojis.cache.filter(nameFilterInexact(search));
  if (!emojis?.size) return null;
  if (emojis.size === 1) return emojis.first() || null;
  const exactEmojis = emojis.filter(nameFilterExact(search));
  if (exactEmojis.size === 1) return exactEmojis.first() || null;
  return null;

  function nameFilterExact(search: any) {
    return (emoji: any) => emoji.name.toLowerCase() === search;
  }
  function nameFilterInexact(search: any) {
    return (emoji: any) => emoji.name.toLowerCase().includes(search);
  }
}

export async function parseGuildMember(val: string, msg: Message): Promise<GuildMember | null> {
  const matches = val.match(/(?:<@!?)?([0-9]{18})>?/);
  try {
    if (matches !== null) return (await msg.guild?.members.fetch(matches[1])) || null;
  } catch (error) {
    logger.error(error);
  }
  const m = val.replace(new RegExp(`\\${PREFIX}[A-Z]+ `, 'gi'), '');
  const search = m.toLowerCase().trim();
  const members = msg.guild?.members.cache.filter(memberFilterInexact(search));
  if (members !== undefined) {
    if (members.size === 0) return null;
    if (members.size === 1) return members.first() || null;
    const exactMembers = members.filter(memberFilterExact(search));
    if (exactMembers.size === 1) return exactMembers.first() || null;
  }
  return null;

  function memberFilterExact(search: any) {
    return (mem: any) =>
      mem.user.username.toLowerCase() === search ||
      (mem.nickname && mem.nickname.toLowerCase() === search) ||
      `${mem.user.username.toLowerCase()}#${mem.user.discriminator}` === search;
  }
  function memberFilterInexact(search: any) {
    return (mem: any) =>
      mem.user.username.toLowerCase().includes(search) ||
      (mem.nickname && mem.nickname.toLowerCase().includes(search)) ||
      `${mem.user.username.toLowerCase()}#${mem.user.discriminator}`.includes(search);
  }
}
