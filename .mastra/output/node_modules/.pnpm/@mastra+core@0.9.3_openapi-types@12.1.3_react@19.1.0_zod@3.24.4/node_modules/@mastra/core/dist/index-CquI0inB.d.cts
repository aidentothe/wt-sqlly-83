import { Transform } from 'stream';
import pino from 'pino';

type RunStatus = 'created' | 'running' | 'completed' | 'failed';
type Run = {
    runId?: string;
    runStatus?: RunStatus;
};

declare const RegisteredLogger: {
    readonly AGENT: "AGENT";
    readonly NETWORK: "NETWORK";
    readonly WORKFLOW: "WORKFLOW";
    readonly LLM: "LLM";
    readonly TTS: "TTS";
    readonly VOICE: "VOICE";
    readonly VECTOR: "VECTOR";
    readonly BUNDLER: "BUNDLER";
    readonly DEPLOYER: "DEPLOYER";
    readonly MEMORY: "MEMORY";
    readonly STORAGE: "STORAGE";
    readonly EMBEDDINGS: "EMBEDDINGS";
};
type RegisteredLogger = (typeof RegisteredLogger)[keyof typeof RegisteredLogger];
declare const LogLevel: {
    readonly DEBUG: "debug";
    readonly INFO: "info";
    readonly WARN: "warn";
    readonly ERROR: "error";
    readonly NONE: "silent";
};
type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];
interface BaseLogMessage extends Run {
    msg: string;
    level: number;
    time: Date;
    pid: number;
    hostname: string;
    name: string;
}
declare class LoggerTransport extends Transform {
    constructor(opts?: any);
    getLogsByRunId(_args: {
        runId: string;
    }): Promise<BaseLogMessage[]>;
    getLogs(): Promise<BaseLogMessage[]>;
}
type TransportMap = Record<string, LoggerTransport>;
declare class Logger {
    protected logger: pino.Logger;
    transports: TransportMap;
    constructor(options?: {
        name?: string;
        level?: LogLevel;
        transports?: TransportMap;
        overrideDefaultTransports?: boolean;
    });
    debug(message: string, args?: Record<string, any>): void;
    info(message: string, args?: Record<string, any>): void;
    warn(message: string, args?: Record<string, any>): void;
    error(message: string, args?: Record<string, any>): void;
    createStream(): Transform;
    getLogs(transportId: string): Promise<BaseLogMessage[]>;
    getLogsByRunId({ runId, transportId }: {
        transportId: string;
        runId: string;
    }): Promise<BaseLogMessage[] | undefined>;
}
declare function createLogger(options: {
    name?: string;
    level?: LogLevel;
    transports?: TransportMap;
}): Logger;
declare class MultiLogger {
    private loggers;
    constructor(loggers: Logger[]);
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}
declare function combineLoggers(loggers: Logger[]): MultiLogger;
declare const noopLogger: {
    debug: () => void;
    info: () => void;
    warn: () => void;
    error: () => void;
    cleanup: () => Promise<void>;
};

export { type BaseLogMessage as B, Logger as L, MultiLogger as M, RegisteredLogger as R, type TransportMap as T, LogLevel as a, LoggerTransport as b, combineLoggers as c, type Run as d, createLogger as e, noopLogger as n };
