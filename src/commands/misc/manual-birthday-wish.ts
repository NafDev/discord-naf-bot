import { Message } from 'discord.js';
import { birthdaysCb } from '../../events/birthday-wishes';
import Command from '../command-interface';

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
  birthdaysCb(message.client);
}
