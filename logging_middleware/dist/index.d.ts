export type LogStack = "backend" | "frontend";
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
export type BackendPackage = "cache" | "controller" | "cron_job" | "db" | "domain" | "handler" | "repository" | "route" | "service";
export type FrontendPackage = "api" | "component" | "hook" | "page" | "state" | "style";
export type SharedPackage = "auth" | "config" | "middleware" | "utils";
export type LogPackage = BackendPackage | FrontendPackage | SharedPackage;
/**
 * Initializes the logger with an authorization token.
 * Call this once at the startup of your frontend and backend apps.
 */
export declare const initLogger: (token: string) => void;
/**
 * Sends a log to the evaluation service.
 * @param stack "backend" or "frontend"
 * @param level "debug", "info", "warn", "error", "fatal"
 * @param pkg The specific package originating the log
 * @param message Descriptive context about the event
 */
export declare const Log: (stack: LogStack, level: LogLevel, pkg: LogPackage, message: string) => Promise<void>;
//# sourceMappingURL=index.d.ts.map