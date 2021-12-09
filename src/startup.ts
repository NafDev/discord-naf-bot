import { Client, Message, MessageEmbed, User } from 'discord.js';
import glob from 'glob';
import Command from './commands/command-interface';
import { config } from './config';
import { mongooseConnect } from './db/mongo';
import BotEvent from './events/event-interface';
import logger from './helpers/logger';

const PREFIX = config.DISCORD_PREFIX;

export async function startup(client: Client, me: User): Promise<void> {
  client.setMaxListeners(20);
  // Establish MongoDB connection
  await mongooseConnect();
  // Register onMessage commands + help command
  registerCommands(client, me);
  // Register bot events
  registerEvents(client);
}

async function registerCommands(client: Client, me: User): Promise<void> {
  const commands = await parseCommands();
  const allCommandPhrases: string[] = [];
  for (const command of commands) {
    // Add name + aliases of new command to array
    let keywords = [command.name];
    if (command.aliases !== null) {
      keywords = keywords.concat(command.aliases);
    }

    // Check for conflicts with existing command phrases
    for (const newKey of keywords) {
      if (allCommandPhrases.includes(newKey)) {
        logger.warn(`Keyword "${newKey}" for command "${command.name}" is already registered to another command`);
        continue;
      }
    }

    // Transform new command phrases into prefixed regex strings
    const cmdStrings = [];
    for (const word of keywords) {
      const partialRegex = `^\\${PREFIX}${word}`;
      cmdStrings.push(partialRegex);
    }

    const keywordsRegex = new RegExp(cmdStrings.join('|'), 'i');

    client.on('messageCreate', (message) => {
      if (message.author === client.user) {
        return;
      }
      if (command.admin === true && message.author !== me) {
        return;
      }
      if (message.content.trimLeft().match(keywordsRegex)) {
        // Shallow-copies an object with its class/prototype intact.
        const clonedMessage: Message = Object.assign(Object.create(message), message);
        clonedMessage.content = message.content.split(keywordsRegex)[1].trimLeft();
        command.function(clonedMessage);
      }
    });

    logger.info(`Registered bot command "${command.name}"`);
  }

  // Help command
  client.on('messageCreate', (message) => {
    if (!message.content.startsWith(PREFIX + 'help')) return;
    if (message.author === client.user) return;
    if (message.author === me && message.content.includes('admin')) {
      const adminCmds: string[] = [];
      Object.values(commands).forEach((cmd) => (cmd.admin ? adminCmds.push(`\`${cmd.name}\``) : null));
      me.send(adminCmds.join(', '));
      return;
    }

    const embed = new MessageEmbed();
    embed.setTitle('Bot Commands');
    embed.setColor('BLURPLE');
    embed.setFooter(`Created by ${me.username}`, me.displayAvatarURL({ dynamic: true }));

    for (const command of commands) {
      if (command.hidden === false) {
        let desc = command.description;
        const aliases = command.aliases?.map((alias) => `\`${alias}\``).join(', ') || '';
        desc += command.aliases !== null && command.aliases.length > 0 ? '\nAliases: ' + aliases : '';
        desc += command.help !== null && command.help.length > 0 ? `\ne.g. \`${PREFIX + command.help}\`` : '';

        embed.addField(PREFIX + command.name, desc || '', false);
      }
    }

    message.channel.send({ embeds: [embed] });
  });
}

async function registerEvents(client: Client): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function isBotEvent(obj: any): obj is BotEvent {
    return Boolean(
      Object.prototype.hasOwnProperty.call(obj, 'name') &&
        typeof obj.name === 'string' &&
        Object.prototype.hasOwnProperty.call(obj, 'function') &&
        typeof obj.function === 'function'
    );
  }

  const files = glob.sync('**/events/**/*.@(js|ts)', { absolute: true, cwd: __dirname });

  for (const file of files) {
    const exportedModules = Object.values(await import(file));
    for (const module of exportedModules) {
      if (isBotEvent(module)) {
        module.function(client);
        logger.info(`Registered bot event "${module.name}"`);
      }
    }
  }
}

async function parseCommands(): Promise<Command[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function isBotCommand(obj: any): obj is Command {
    return Boolean(
      Object.prototype.hasOwnProperty.call(obj, 'name') &&
        typeof obj.name === 'string' &&
        Object.prototype.hasOwnProperty.call(obj, 'hidden') &&
        typeof obj.hidden === 'boolean' &&
        Object.prototype.hasOwnProperty.call(obj, 'function') &&
        typeof obj.function === 'function'
    );
  }

  const commands: Command[] = [];
  const files = glob.sync('**/commands/**/*.@(js|ts)', { absolute: true, cwd: __dirname });
  for (const file of files) {
    const exportedModules = Object.values(await import(file));
    for (const module of exportedModules) {
      if (isBotCommand(module)) {
        commands.push(module);
      }
    }
  }
  return commands;
}
