// --- CONFIGURATION ---
// Store the auth token for the protected route
let authToken = null;
/**
 * Initializes the logger with an authorization token.
 * Call this once at the startup of your frontend and backend apps.
 */
export const initLogger = (token) => {
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
export const Log = async (stack, level, pkg, message) => {
    const url = "http://4.224.186.213/evaluation-service/logs";
    const payload = {
        stack,
        level,
        package: pkg,
        message,
    };
    const headers = {
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
    }
    catch (error) {
        console.error(`[Logging Middleware] Network error while sending log:`, error);
    }
};
//# sourceMappingURL=index.js.map