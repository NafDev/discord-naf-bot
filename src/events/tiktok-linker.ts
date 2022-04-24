import { PuppeteerHandler } from '../helpers/puppeteerHandler';
import { downloadVideo } from '../helpers/util';
import { resolve } from 'path';
import { Client } from 'discord.js';
import logger from '../helpers/logger';
import BotEvent from './event-interface';
import { unlink } from 'fs';
import { tmpdir } from 'os';

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

        if (resolvedUrls.has(shareUrl)) {
          await message.channel.send(resolvedUrls.get(shareUrl));
          return;
        }

        let videoSrc: string;

        try {
          videoSrc = await getTiktokVideoSrc(shareUrl);
          if (!videoSrc) {
            throw new Error('videoSrc is null or undefined');
          }
        } catch (error) {
          logger.error('Failed to scrape TikTok video source', error);
          return;
        }

        try {
          const path = resolve(tmpdir(), `tiktok_dl_${new Date().getTime()}.mp4`);
          await downloadVideo(videoSrc, path);

          const discordMsg = await message.channel.send({ files: [path] });

          resolvedUrls.set(shareUrl, discordMsg.attachments.first().url);

          unlink(path, () => undefined);
        } catch (error) {
          logger.error(error);
        }

        return;
      }
    }
  });
}

async function getTiktokVideoSrc(url: string): Promise<string> {
  const puppeteer = PuppeteerHandler.getInstance();

  return puppeteer.addJob<string>(async (page) => {
    await page.goto(url);
    return page.evaluate('document.querySelector("video").getAttribute("src")');
  });
}
