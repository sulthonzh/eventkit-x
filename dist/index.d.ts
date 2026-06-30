import { EventEmitter } from './EventEmitter.js';
import { EventGroup } from './EventGroup.js';
import { EventMiddleware, createEventBus, Middleware } from './EventMiddleware.js';
export type { EventMetadata, EventHandler, AsyncEventHandler, EventSubscription, EventOptions, EmitOptions, ListenerCount, EventStats } from './types.js';
export { EventEmitter, EventGroup, EventMiddleware, createEventBus, Middleware };
export type { EventEmitter as Events };
export declare function createEventEmitter(): EventEmitter;
export declare const VERSION = "1.0.0";
//# sourceMappingURL=index.d.ts.map