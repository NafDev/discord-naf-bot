import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import { Client } from 'discord.js';
import { scheduleJob } from 'node-schedule';
import { BirthdayModel } from '../db/models/birthday.schema';
import logger from '../helpers/logger';
import BotEvent from './event-interface';

dayjs.extend(isToday);

export const event: BotEvent = {
  name: 'birthday-wishes',
  function: run,
};

async function run(client: Client): Promise<void> {
  scheduleJob('00 12 * * *', async () => {
    const birthdayModels = await BirthdayModel.find().exec();

    for (const model of birthdayModels) {
      const bday = dayjs(model.date);
      if (bday.isToday()) {
        const server = await client.guilds.fetch(model.serverId);
        const user = await server.members.fetch(model.userId);
        if (!server || !user) {
          logger.warn(`Couldn't find server/user for birthday. Server "${model.serverId}", User "${model.userId}"`);
          return;
        }

        const channel = server.channels.cache.find((channel) => channel.name.includes('general') && channel.isText());

        if (!channel || !channel.isText()) {
          logger.warn(`Couldn't find general text channel for guild: ${server.name}`);
          return;
        }

        const years = Math.floor(dayjs().diff(bday, 'year'));

        return channel.send(`Happy ${ordinal_suffix_of(years)} birthday ${user}!`);
      }
    }
  });
}

function ordinal_suffix_of(i) {
  const j = i % 10,
    k = i % 100;
  if (j == 1 && k != 11) {
    return i + 'st';
  }
  if (j == 2 && k != 12) {
    return i + 'nd';
  }
  if (j == 3 && k != 13) {
    return i + 'rd';
  }
  return i + 'th';
}
