import { Transform } from 'stream';
import pino from 'pino';
import pretty from 'pino-pretty';

// src/logger/index.ts
var RegisteredLogger = {
  AGENT: "AGENT",
  NETWORK: "NETWORK",
  WORKFLOW: "WORKFLOW",
  LLM: "LLM",
  TTS: "TTS",
  VOICE: "VOICE",
  VECTOR: "VECTOR",
  BUNDLER: "BUNDLER",
  DEPLOYER: "DEPLOYER",
  MEMORY: "MEMORY",
  STORAGE: "STORAGE",
  EMBEDDINGS: "EMBEDDINGS"
};
var LogLevel = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  NONE: "silent"
};
var LoggerTransport = class extends Transform {
  constructor(opts = {}) {
    super({ ...opts, objectMode: true });
  }
  async getLogsByRunId(_args) {
    return [];
  }
  async getLogs() {
    return [];
  }
};
var Logger = class {
  logger;
  transports;
  constructor(options = {}) {
    this.transports = options.transports || {};
    const transportsAry = Object.entries(this.transports);
    this.logger = pino(
      {
        name: options.name || "app",
        level: options.level || LogLevel.INFO,
        formatters: {
          level: (label) => {
            return {
              level: label
            };
          }
        }
      },
      options.overrideDefaultTransports ? options?.transports?.default : transportsAry.length === 0 ? pretty({
        colorize: true,
        levelFirst: true,
        ignore: "pid,hostname",
        colorizeObjects: true,
        translateTime: "SYS:standard",
        singleLine: false
      }) : pino.multistream([
        ...transportsAry.map(([, transport]) => ({
          stream: transport,
          level: options.level || LogLevel.INFO
        })),
        {
          stream: pretty({
            colorize: true,
            levelFirst: true,
            ignore: "pid,hostname",
            colorizeObjects: true,
            translateTime: "SYS:standard",
            singleLine: false
          }),
          level: options.level || LogLevel.INFO
        }
      ])
    );
  }
  debug(message, args = {}) {
    this.logger.debug(args, message);
  }
  info(message, args = {}) {
    this.logger.info(args, message);
  }
  warn(message, args = {}) {
    this.logger.warn(args, message);
  }
  error(message, args = {}) {
    this.logger.error(args, message);
  }
  // Stream creation for process output handling
  createStream() {
    return new Transform({
      transform: (chunk, _encoding, callback) => {
        const line = chunk.toString().trim();
        if (line) {
          this.info(line);
        }
        callback(null, chunk);
      }
    });
  }
  async getLogs(transportId) {
    if (!transportId || !this.transports[transportId]) {
      return [];
    }
    return this.transports[transportId].getLogs();
  }
  async getLogsByRunId({ runId, transportId }) {
    return this.transports[transportId]?.getLogsByRunId({ runId });
  }
};
function createLogger(options) {
  return new Logger(options);
}
var MultiLogger = class {
  loggers;
  constructor(loggers) {
    this.loggers = loggers;
  }
  debug(message, ...args) {
    this.loggers.forEach((logger) => logger.debug(message, ...args));
  }
  info(message, ...args) {
    this.loggers.forEach((logger) => logger.info(message, ...args));
  }
  warn(message, ...args) {
    this.loggers.forEach((logger) => logger.warn(message, ...args));
  }
  error(message, ...args) {
    this.loggers.forEach((logger) => logger.error(message, ...args));
  }
};
function combineLoggers(loggers) {
  return new MultiLogger(loggers);
}
var noopLogger = {
  debug: () => {
  },
  info: () => {
  },
  warn: () => {
  },
  error: () => {
  },
  cleanup: async () => {
  }
};

export { LogLevel, Logger, LoggerTransport, MultiLogger, RegisteredLogger, combineLoggers, createLogger, noopLogger };
