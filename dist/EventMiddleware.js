import { EventEmitter } from './EventEmitter.js';
export class EventMiddleware extends EventEmitter {
    constructor() {
        super(...arguments);
        this.middlewares = [];
        this.stopped = false;
    }
    /**
     * Add middleware to the chain
     */
    use(middleware) {
        this.middlewares.push(middleware);
    }
    /**
     * Emit event through middleware chain
     */
    async emit(event, data, options) {
        this.stopped = false;
        const context = {
            data,
            metadata: {
                timestamp: Date.now(),
                eventId: `middleware_evt_${Date.now()}`,
                source: options?.source
            },
            event,
            next: async () => {
                if (this.stopped)
                    return;
                // If no more middleware, emit to listeners
                if (this.middlewares.length === 0) {
                    await super.emit(event, data, options);
                    return;
                }
                // Execute first middleware
                const middleware = this.middlewares.shift();
                await middleware(context);
            },
            stop: () => {
                this.stopped = true;
            }
        };
        await context.next();
        return this.listenerCount(event);
    }
    /**
     * Clear all middleware
     */
    clearMiddleware() {
        this.middlewares = [];
    }
}
/**
 * Create a simple event bus with middleware support
 */
export function createEventBus(options) {
    const bus = new EventMiddleware();
    if (options?.globalMiddleware) {
        options.globalMiddleware.forEach(middleware => bus.use(middleware));
    }
    return bus;
}
/**
 * Predefined middleware
 */
export const Middleware = {
    /**
     * Log all events
     */
    logger: (logger = console.log) => async (context) => {
        logger(context.event, context.data);
        await context.next();
    },
    /**
     * Validate event data
     */
    validator: (validator, errorFactory = (data) => new Error(`Invalid data for event`)) => async (context) => {
        if (!validator(context.data)) {
            throw errorFactory(context.data);
        }
        await context.next();
    },
    /**
     * Throttle event emissions
     */
    throttle: (ms) => {
        let lastEmit = 0;
        return async (context) => {
            const now = Date.now();
            if (now - lastEmit < ms) {
                return;
            }
            lastEmit = now;
            await context.next();
        };
    },
    /**
     * Debounce event emissions
     */
    debounce: (ms) => {
        let timeout;
        return async (context) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => context.next(), ms);
        };
    },
    /**
     * Transform event data before processing
     */
    transform: (transformer) => async (context) => {
        context.data = transformer(context.data);
        await context.next();
    },
    /**
     * Add timing information to metadata
     */
    timing: () => async (context) => {
        context.metadata.timestamp = Date.now();
        await context.next();
    }
};
//# sourceMappingURL=EventMiddleware.js.map