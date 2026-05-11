import { initLogger, Log } from 'logging-middleware';

// At your app's entry point (e.g., index.ts or App.tsx)
initLogger("your_protected_route_token_here");

// Anywhere in your app
// Log("backend", "error", "handler", "received string, expected bool");