import { Client } from 'discord.js';
import logger from '../helpers/logger';
import BotEvent from './event-interface';

export const event: BotEvent = {
  name: 'tiktok-linker',
  function: run,
};

const tiktokRegexps = [
  /https:\/\/vm\.tiktok\.com\/[A-Za-z0-9]+\//,
  /https:\/\/www\.tiktok\.com\/@[A-Za-z0-9]+\/video\/[\d]+/,
];

async function run(client: Client): Promise<void> {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    for (const regexp of tiktokRegexps) {
      const find = message.content.match(regexp);
      if (find) {
        let videoSrc: string;
        try {
          videoSrc = await getTiktokVideoSrc(find[0]);
          if (!videoSrc) {
            throw new Error('videoSrc is null or undefined');
          }
        } catch (error) {
          logger.error('Failed to scrape TikTok video source', error);
          return;
        }

        await message.channel.send(videoSrc);
        return;
      }
    }
  });
}

import puppeteer from 'puppeteer';

async function getTiktokVideoSrc(url: string): Promise<string> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url);

  return page.evaluate('document.querySelector("video").getAttribute("src")').finally(() => browser.close());
}
