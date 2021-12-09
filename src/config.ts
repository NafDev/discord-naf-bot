import * as dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: './dev.env' });
}

export const config = process.env;

const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = config;

export const DB_URL =
  config.NODE_ENV === 'production'
    ? `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}?authSource=admin&ssl=true`
    : `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=admin`;
