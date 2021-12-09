import { connect } from 'mongoose';
import { DB_URL } from '../config';
import logger from '../helpers/logger';

export async function mongooseConnect(): Promise<void> {
  await connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  }).then(() => {
    logger.info('Connected to MongoDB');
  });
}
