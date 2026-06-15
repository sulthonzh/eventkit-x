import { EventEmitter } from './EventEmitter.js';
import { EventHandler, EventMetadata } from './types.js';

export interface MiddlewareContext<T = any> {
  data: T;
  metadata: EventMetadata;
  next: () => Promise<void>;
  stop: () => void;
  event: string;
}

export type MiddlewareHandler<T = any> = (context: MiddlewareContext<T>) => Promise<void> | void;

export class EventMiddleware<T = any> extends EventEmitter {
  private middlewares: MiddlewareHandler<T>[] = [];
  private stopped = false;

  /**
   * Add middleware to the chain
   */
  use(middleware: MiddlewareHandler<T>): void {
    this.middlewares.push(middleware);
  }

  /**
   * Emit event through middleware chain
   */
  async emit(event: string, data: any, options?: any): Promise<number> {
    this.stopped = false;
    
    const context: MiddlewareContext<T> = {
      data,
      metadata: {
        timestamp: Date.now(),
        eventId: `middleware_evt_${Date.now()}`,
        source: options?.source
      },
      event,
      next: async () => {
        if (this.stopped) return;
        
        // If no more middleware, emit to listeners
        if (this.middlewares.length === 0) {
          await super.emit(event, data, options);
          return;
        }

        // Execute first middleware
        const middleware = this.middlewares.shift()!;
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
  clearMiddleware(): void {
    this.middlewares = [];
  }
}

/**
 * Create a simple event bus with middleware support
 */
export function createEventBus<T = any>(options?: {
  globalMiddleware?: MiddlewareHandler<T>[];
}): EventMiddleware<T> {
  const bus = new EventMiddleware<T>();
  
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
  logger: <T>(logger: (event: string, data: T) => void = console.log): MiddlewareHandler<T> => 
    async (context) => {
      logger(context.event, context.data);
      await context.next();
    },

  /**
   * Validate event data
   */
  validator: <T>(validator: (data: T) => boolean, 
    errorFactory: (data: T) => Error = (data) => new Error(`Invalid data for event`)): MiddlewareHandler<T> =>
    async (context) => {
      if (!validator(context.data)) {
        throw errorFactory(context.data);
      }
      await context.next();
    },

  /**
   * Throttle event emissions
   */
  throttle: <T>(ms: number): MiddlewareHandler<T> => {
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
  debounce: <T>(ms: number): MiddlewareHandler<T> => {
    let timeout: NodeJS.Timeout;
    return async (context) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => context.next(), ms);
    };
  },

  /**
   * Transform event data before processing
   */
  transform: <T>(transformer: (data: T) => T): MiddlewareHandler<T> => 
    async (context) => {
      context.data = transformer(context.data as T);
      await context.next();
    },

  /**
   * Add timing information to metadata
   */
  timing: <T>(): MiddlewareHandler<T> => 
    async (context) => {
      context.metadata.timestamp = Date.now();
      await context.next();
    }
};