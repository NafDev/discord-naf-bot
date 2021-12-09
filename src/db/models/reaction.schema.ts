import { getModelForClass, prop } from '@typegoose/typegoose';
import { DISCORD_SNOWFLAKE, EMOJI } from '../common-validators';

export class Reaction {
  @prop({ required: true, index: true, match: DISCORD_SNOWFLAKE })
  serverId: string;

  @prop({ required: true, index: true, match: EMOJI })
  emojiId: string;

  @prop({ required: true, index: true, match: DISCORD_SNOWFLAKE })
  userId: string;

  @prop({ required: true, min: 0 })
  count: number;
}

export const ReactionModel = getModelForClass(Reaction);
