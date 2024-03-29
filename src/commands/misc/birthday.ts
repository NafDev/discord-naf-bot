import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import { Message } from 'discord.js';
import { BirthdayModel } from '../../db/models/birthday.schema';
import Command from '../command-interface';

dayjs.extend(customParseFormat);
dayjs.extend(utc);

const commandFormat = /^\d{2}\/\d{2}\/\d{4}$/;

async function run(message: Message): Promise<Message> {
  let birthday: dayjs.Dayjs;
  let deleteBirthday = false;

  switch (true) {
    case message.content.trim() === '':
      deleteBirthday = true;
      break;
    case commandFormat.test(message.content) === false:
      return message.reply('Invalid command format. Correct format: `DD/MM/YYYY`');
    default:
      birthday = dayjs.utc(message.content, 'DD/MM/YYYY', true);

      if (!birthday.isValid() || !birthday.isBefore(new Date())) {
        return message.reply('Invalid date');
      }
  }

  let birthdayEntity = await BirthdayModel.findOne({ serverId: message.guildId, userId: message.author.id }).exec();

  if (deleteBirthday) {
    if (!birthdayEntity) {
      return message.reply("I don't have your birthday, there's nothing to delete.");
    } else {
      await birthdayEntity.delete();
      return message.reply("I've deleted your birthday.");
    }
  }

  if (!birthdayEntity) {
    birthdayEntity = new BirthdayModel({
      serverId: message.guildId,
      userId: message.author.id,
      date: birthday.toDate(),
    });
  } else {
    birthdayEntity.date = birthday.toDate();
  }

  await birthdayEntity.save();

  return message.reply(`I will wish you a happy birthday every year on ${birthday.format('D MMMM')}`);
}

export const Birthday: Command = {
  name: 'birthday',
  aliases: null,
  description:
    "Tell me your birthday and I'll remind everyone to wish you a good day. To remove your birthday, post the command with no date",
  help: 'birthday DD/MM/YYYY',
  hidden: false,
  admin: false,
  function: run,
};
