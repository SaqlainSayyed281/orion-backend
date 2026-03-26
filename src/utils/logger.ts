/**
 * Centralized logger utility.
 * Uses structured JSON in production, pretty-printed in development.
 */

const IS_PROD = process.env.NODE_ENV === 'production';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function log(level: LogLevel, context: string, message: string, meta?: Record<string, unknown>): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    context,
    message,
    ...(meta && { meta }),
  };

  if (IS_PROD) {
    // Structured JSON for log aggregators (CloudWatch, Datadog, etc.)
    const output = JSON.stringify(entry);
    if (level === 'error') process.stderr.write(output + '\n');
    else process.stdout.write(output + '\n');
  } else {
    // Human-readable for local dev
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${context}]`;
    const metaStr = meta ? ' ' + JSON.stringify(meta) : '';
    const line = `${prefix} ${message}${metaStr}`;
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  }
}

export const logger = {
  info: (context: string, message: string, meta?: Record<string, unknown>) =>
    log('info', context, message, meta),
  warn: (context: string, message: string, meta?: Record<string, unknown>) =>
    log('warn', context, message, meta),
  error: (context: string, message: string, meta?: Record<string, unknown>) =>
    log('error', context, message, meta),
  debug: (context: string, message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') log('debug', context, message, meta);
  },
};
