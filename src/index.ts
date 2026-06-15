// Import classes first
import { EventEmitter } from './EventEmitter.js';
import { EventGroup } from './EventGroup.js';
import { EventMiddleware, createEventBus, Middleware } from './EventMiddleware.js';

// Type exports
export type {
  EventMetadata,
  EventHandler,
  AsyncEventHandler,
  EventSubscription,
  EventOptions,
  EmitOptions,
  ListenerCount,
  EventStats
} from './types.js';

// Main class exports
export { EventEmitter, EventGroup, EventMiddleware };

// Convenience aliases
export type { EventEmitter as Events };

// Factory function
export function createEventEmitter() {
  return new EventEmitter();
}

// Version
export const VERSION = '1.0.0';