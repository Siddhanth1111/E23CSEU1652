// --- TYPES ---
export type LogStack = "backend" | "frontend";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export type BackendPackage = 
  | "cache" | "controller" | "cron_job" | "db" 
  | "domain" | "handler" | "repository" | "route" | "service";

export type FrontendPackage = 
  | "api" | "component" | "hook" | "page" | "state" | "style";

export type SharedPackage = 
  | "auth" | "config" | "middleware" | "utils";

export type LogPackage = BackendPackage | FrontendPackage | SharedPackage;

// --- CONFIGURATION ---
// Store the auth token for the protected route
let authToken: string | null = null;

/**
 * Initializes the logger with an authorization token.
 * Call this once at the startup of your frontend and backend apps.
 */
export const initLogger = (token: string) => {
  authToken = token;
};

// --- LOG FUNCTION ---
/**
 * Sends a log to the evaluation service.
 * @param stack "backend" or "frontend"
 * @param level "debug", "info", "warn", "error", "fatal"
 * @param pkg The specific package originating the log
 * @param message Descriptive context about the event
 */
export const Log = async (
  stack: LogStack,
  level: LogLevel,
  pkg: LogPackage,
  message: string
): Promise<void> => {
  const url = "http://4.224.186.213/evaluation-service/logs";
  
  const payload = {
    stack,
    level,
    package: pkg,
    message,
  };

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Append authorization if the route requires a bearer token
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Logging Middleware] Failed to send log: ${response.status} ${errorText}`);
    }
  } catch (error) {
    console.error(`[Logging Middleware] Network error while sending log:`, error);
  }
};