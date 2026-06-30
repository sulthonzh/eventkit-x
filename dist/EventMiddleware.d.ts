import { EventEmitter } from './EventEmitter.js';
import { EventMetadata } from './types.js';
export interface MiddlewareContext<T = any> {
    data: T;
    metadata: EventMetadata;
    next: () => Promise<void>;
    stop: () => void;
    event: string;
}
export type MiddlewareHandler<T = any> = (context: MiddlewareContext<T>) => Promise<void> | void;
export declare class EventMiddleware<T = any> extends EventEmitter {
    private middlewares;
    /**
     * Add middleware to the chain
     */
    use(middleware: MiddlewareHandler<T>): void;
    /**
     * Emit event through middleware chain
     */
    emit(event: string, data: any, options?: any): Promise<number>;
    /**
     * Clear all middleware
     */
    clearMiddleware(): void;
}
/**
 * Create a simple event bus with middleware support
 */
export declare function createEventBus<T = any>(options?: {
    globalMiddleware?: MiddlewareHandler<T>[];
}): EventMiddleware<T>;
/**
 * Predefined middleware
 */
export declare const Middleware: {
    /**
     * Log all events
     */
    logger: <T>(logger?: (event: string, data: T) => void) => MiddlewareHandler<T>;
    /**
     * Validate event data
     */
    validator: <T>(validator: (data: T) => boolean, errorFactory?: (data: T) => Error) => MiddlewareHandler<T>;
    /**
     * Throttle event emissions
     */
    throttle: <T>(ms: number) => MiddlewareHandler<T>;
    /**
     * Debounce event emissions
     */
    debounce: <T>(ms: number) => MiddlewareHandler<T>;
    /**
     * Transform event data before processing
     */
    transform: <T>(transformer: (data: T) => T) => MiddlewareHandler<T>;
    /**
     * Add timing information to metadata
     */
    timing: <T>() => MiddlewareHandler<T>;
};
//# sourceMappingURL=EventMiddleware.d.ts.map