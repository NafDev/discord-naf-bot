import { Message } from 'discord.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default interface Command {
  name: string;
  aliases: string[] | null;
  description: string | null;
  help: string | null;
  hidden: boolean;
  admin: boolean;
  function: (message: Message, ...params: any) => any;
}

/* Command template
import { Message } from 'discord.js';
import Command from '../command-interface';

const CommandName: Command = {
  name: 'commandname',
  aliases: null,
  description: null,
  help: null,
  hidden: false,
  admin: false,
  function: run,
};

async function run(message: Message) {}
*/
