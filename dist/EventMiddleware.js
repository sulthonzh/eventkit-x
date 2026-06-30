import { EventEmitter } from './EventEmitter.js';
export class EventMiddleware extends EventEmitter {
    constructor() {
        super(...arguments);
        this.middlewares = [];
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
        let stopped = false;
        let index = 0;
        const context = {
            data,
            metadata: {
                timestamp: Date.now(),
                eventId: `middleware_evt_${Date.now()}`,
                source: options?.source
            },
            event,
            next: async () => {
                if (stopped)
                    return;
                if (index >= this.middlewares.length) {
                    await super.emit(event, context.data, options);
                    return;
                }
                const middleware = this.middlewares[index++];
                await middleware(context);
            },
            stop: () => {
                stopped = true;
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