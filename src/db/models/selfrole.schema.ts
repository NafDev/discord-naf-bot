import { prop, getModelForClass } from '@typegoose/typegoose';
import { DISCORD_SNOWFLAKE, EMOJI } from '../common-validators';

export class SelfRole {
  @prop({ required: true, match: DISCORD_SNOWFLAKE })
  channelId: string;

  @prop({ required: true, match: DISCORD_SNOWFLAKE })
  messageId: string;

  @prop({ required: true, match: DISCORD_SNOWFLAKE })
  roleId: string;

  @prop({ required: true, match: EMOJI })
  emojiId: string;
}

export const SelfRoleModel = getModelForClass(SelfRole);
