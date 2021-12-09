/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from 'discord.js';

export default interface BotEvent {
  name: string;
  function: (client: Client, ...params: any) => any;
}
