import { createLogger, format, transports } from 'winston';
import 'winston-mongodb';
import { DB_URL } from '../config';
const { combine, timestamp, printf, colorize, errors } = format;

const timezone = () => {
  return new Date().toLocaleString('sv', {
    timeZone: 'Europe/London',
  });
};

const baseFormat = combine(
  colorize({
    all: true,
  }),
  errors({ stack: true }),
  timestamp({ format: timezone }),
  printf((info) => `${info.timestamp} [${info.level}] : ${info.message}`)
);

const logger = createLogger({
  format: baseFormat,

  transports: [
    new transports.Console({ format: baseFormat }),
    new transports.MongoDB({
      db: DB_URL,
      collection: 'error_logs',
      decolorize: true,
      tryReconnect: true,
      options: {
        useUnifiedTopology: true,
      },
      level: 'error',
    }),
  ],

  exceptionHandlers: [
    new transports.Console({ format: baseFormat }),
    new transports.MongoDB({
      db: DB_URL,
      collection: 'error_logs',
      decolorize: true,
      tryReconnect: true,
      options: {
        useUnifiedTopology: true,
      },
      level: 'error',
    }),
  ],
});

export default logger;
