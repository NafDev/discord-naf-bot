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

const resolvedUrls: Map<string, string> = new Map();

async function run(client: Client): Promise<void> {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    for (const regexp of tiktokRegexps) {
      const find = message.content.match(regexp);
      if (find) {
        const shareUrl = find[0];
        let videoSrc: string;

        try {
          videoSrc = await getTiktokVideoSrc(shareUrl);
          if (!videoSrc) {
            throw new Error('videoSrc is null or undefined');
          }

          if (!resolvedUrls.has(shareUrl)) {
            resolvedUrls.set(shareUrl, videoSrc);
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

import { PuppeteerHandler } from '../helpers/puppeteerHandler';

async function getTiktokVideoSrc(url: string): Promise<string> {
  const puppeteer = PuppeteerHandler.getInstance();

  return puppeteer.addJob<string>(async (page) => {
    if (resolvedUrls.has(url)) {
      return resolvedUrls.get(url);
    }
    await page.goto(url);
    return page.evaluate('document.querySelector("video").getAttribute("src")');
  });
}
