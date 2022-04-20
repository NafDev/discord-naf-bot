import axios from 'axios';
import * as cheerio from 'cheerio';
import { Client } from 'discord.js';
import logger from '../helpers/logger';
import BotEvent from './event-interface';

export const event: BotEvent = {
  name: 'tiktok-linker',
  function: run,
};

const tiktokRegexps = [
  /https:\/\/vm.tiktok.com\/(?<videoid>[A-Za-z0-9]+)\//,
  /(?:@[a-zA-z0-9]*|.*)(?:\/.*\/|trending.?shareId=)(?<videoid>[\d]*)/,
];

async function run(client: Client): Promise<void> {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    try {
      for (const regexp of tiktokRegexps) {
        const find = message.content.match(regexp);
        if (find && find.groups.videoid) {
          const videoId = find.groups.videoid;

          const page = await axios.get(`https://proxitok.herokuapp.com/@placeholder/video/${videoId}`, {
            headers: { accept: '*/*' },
          });
          const $ = cheerio.load(page.data);
          const src = $('video source').attr('src');

          const match = src.match(/(?<=\?url=).+/);

          if (match) {
            const url = decodeURIComponent(match[0]);
            let shortUrl: string;

            const config = {
              headers: { Authorization: `Bearer JdFvkAeSGLXkCsn5bVQSbztJOiWLPdIDRJ5v9mruSacQbVXZqD1XBTgsjdA1` },
            };

            try {
              const urlDayRes = await axios.post('https://www.urlday.com/api/v1/links', { url }, config);
              urlDayRes;
              shortUrl = urlDayRes.data.data.short_url;

              await message.channel.send(shortUrl || url);
            } catch (error) {
              logger.warn(error);
            }

            return;
          }
        }
      }
    } catch (error) {
      logger.error('Failed to link TikTok: ' + error);
    }
  });
}
