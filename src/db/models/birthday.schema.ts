import { getModelForClass, index, prop } from '@typegoose/typegoose';
import { DISCORD_SNOWFLAKE } from '../common-validators';

@index({ serverId: 1, userId: 1 }, { unique: true })
export class Birthday {
  @prop({ required: true, match: DISCORD_SNOWFLAKE })
  serverId: string;

  @prop({ required: true, match: DISCORD_SNOWFLAKE })
  userId: string;

  @prop({ required: true })
  date: Date;
}

export const BirthdayModel = getModelForClass(Birthday);
