// Import classes first
import { EventEmitter } from './EventEmitter.js';
import { EventGroup } from './EventGroup.js';
import { EventMiddleware, createEventBus, Middleware } from './EventMiddleware.js';
// Main class exports
export { EventEmitter, EventGroup, EventMiddleware, createEventBus, Middleware };
// Factory function
export function createEventEmitter() {
    return new EventEmitter();
}
// Version
export const VERSION = '1.0.0';
//# sourceMappingURL=index.js.map