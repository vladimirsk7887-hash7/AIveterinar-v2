import pino from 'pino';

let _logger = null;

export function createLogger() {
  if (_logger) return _logger;

  const level = process.env.LOG_LEVEL || 'info';
  const isDev = process.env.NODE_ENV !== 'production';

  _logger = pino({
    level,
    ...(isDev && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    }),
  });

  return _logger;
}
