import { getModelForClass, prop } from '@typegoose/typegoose';
import { DISCORD_SNOWFLAKE } from '../common-validators';

export class Birthday {
  @prop({ required: true, unique: true, match: DISCORD_SNOWFLAKE })
  serverId: string;

  @prop({ required: true, unique: true, match: DISCORD_SNOWFLAKE })
  userId: string;

  @prop({ required: true })
  date: Date;
}

export const BirthdayModel = getModelForClass(Birthday);
