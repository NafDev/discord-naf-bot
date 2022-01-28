import { Message } from 'discord.js';
import Command from '../command-interface';
import { event } from '../../events/birthday-wishes';

export const ManualBirthdayWish: Command = {
  name: 'wishbirthdays',
  aliases: null,
  description: null,
  help: null,
  hidden: true,
  admin: true,
  function: run,
};

async function run(message: Message): Promise<void> {
  event.function(message.client);
}
