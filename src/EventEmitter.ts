import { EventSubscription, EventHandler, AsyncEventHandler, EventMetadata, EventOptions, EmitOptions, EventStats } from './types.js';

export class EventEmitter {
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private maxListeners: number = 100;
  private eventCounter: number = 0;
  private stats: EventStats = {
    totalEmitted: 0,
    totalListeners: 0,
    eventCounts: new Map()
  };

  /**
   * Register an event listener
   */
  on<T = any>(event: string, handler: EventHandler<T>, options: {
    priority?: number;
    filter?: (data: T, metadata: EventMetadata) => boolean;
  } = {}): string {
    return this._subscribe(event, handler, false, options);
  }

  /**
   * Register an event listener that will be removed after first emit
   */
  once<T = any>(event: string, handler: EventHandler<T>, options: {
    priority?: number;
    filter?: (data: T, metadata: EventMetadata) => boolean;
  } = {}): string {
    return this._subscribe(event, handler, true, options);
  }

  /**
   * Register an async event listener
   */
  onAsync<T = any>(event: string, handler: AsyncEventHandler<T>, options: {
    priority?: number;
    filter?: (data: T, metadata: EventMetadata) => boolean;
  } = {}): string {
    return this._subscribe(event, handler, false, options);
  }

  /**
   * Register an async event listener that will be removed after first emit
   */
  onceAsync<T = any>(event: string, handler: AsyncEventHandler<T>, options: {
    priority?: number;
    filter?: (data: T, metadata: EventMetadata) => boolean;
  } = {}): string {
    return this._subscribe(event, handler, true, options);
  }

  /**
   * Emit an event to all listeners
   */
  async emit<T = any>(event: string, data: T, options: EmitOptions & EventOptions = {}): Promise<number> {
    // Update stats (even if no listeners)
    this.stats.totalEmitted++;
    this.stats.eventCounts.set(event, (this.stats.eventCounts.get(event) || 0) + 1);

    const subscriptions = this.getSubscriptions(event);
    const wildcardSubscriptions = this.getSubscriptions('*');
    const allSubscriptions = [...subscriptions, ...wildcardSubscriptions];

    if (allSubscriptions.length === 0) {
      return 0;
    }

    // Sort by priority (higher priority first)
    allSubscriptions.sort((a, b) => b.priority - a.priority);

    const metadata: EventMetadata = {
      timestamp: options.timestamp ?? Date.now(),
      eventId: this.generateEventId(),
      source: options.source
    };

    let emittedCount = 0;
    let remainingLimit = options.limit ?? Infinity;

    for (const subscription of allSubscriptions) {
      if (remainingLimit <= 0) break;

      // Apply filter if exists
      if (subscription.filter && !subscription.filter(data, metadata)) {
        continue;
      }

      // Emit limit check
      if (options.filter && !options.filter(data)) {
        continue;
      }

      try {
        await subscription.handler(data, metadata);
        emittedCount++;
        remainingLimit--;
      } catch (error) {
        // Error handling for individual handler
        console.error(`Error in event handler for "${event}":`, error);
      }
    }

    return emittedCount;
  }

  /**
   * Emit an event synchronously
   */
  emitSync<T = any>(event: string, data: T, options: EmitOptions & EventOptions = {}): number {
    // Update stats (even if no listeners)
    this.stats.totalEmitted++;
    this.stats.eventCounts.set(event, (this.stats.eventCounts.get(event) || 0) + 1);

    const subscriptions = this.getSubscriptions(event);
    const wildcardSubscriptions = this.getSubscriptions('*');
    const allSubscriptions = [...subscriptions, ...wildcardSubscriptions];

    if (allSubscriptions.length === 0) {
      return 0;
    }

    // Sort by priority (higher priority first)
    allSubscriptions.sort((a, b) => b.priority - a.priority);

    const metadata: EventMetadata = {
      timestamp: options.timestamp ?? Date.now(),
      eventId: this.generateEventId(),
      source: options.source
    };

    let emittedCount = 0;
    let remainingLimit = options.limit ?? Infinity;

    for (const subscription of allSubscriptions) {
      if (remainingLimit <= 0) break;

      // Apply filter if exists
      if (subscription.filter && !subscription.filter(data, metadata)) {
        continue;
      }

      // Emit limit check
      if (options.filter && !options.filter(data)) {
        continue;
      }

      try {
        const handler = subscription.syncHandler || subscription.handler;
        handler(data, metadata);
        emittedCount++;
        remainingLimit--;
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error);
      }
    }

    return emittedCount;
  }

  /**
   * Remove an event listener by subscription ID
   */
  off(subscriptionId: string): boolean {
    for (const [event, subscriptions] of this.subscriptions.entries()) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subscriptions.splice(index, 1);
        this.updateStats();
        return true;
      }
    }
    return false;
  }

  /**
   * Remove all listeners for an event, or all listeners if no event specified
   */
  removeAllListeners(event?: string): number {
    if (event) {
      const count = this.subscriptions.get(event)?.length || 0;
      this.subscriptions.delete(event);
      this.updateStats();
      return count;
    } else {
      const count = this.getTotalListeners();
      this.subscriptions.clear();
      this.updateStats();
      return count;
    }
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount(event: string): number {
    return this.getSubscriptions(event).length;
  }

  /**
   * Get all event names that have listeners
   */
  eventNames(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Set maximum number of listeners per event
   */
  setMaxListeners(n: number): void {
    this.maxListeners = n;
  }

  /**
   * Get event statistics
   */
  getStats(): EventStats {
    return { ...this.stats };
  }

  /**
   * Clear event statistics
   */
  clearStats(): void {
    this.stats = {
      totalEmitted: 0,
      totalListeners: 0,
      eventCounts: new Map()
    };
  }

  // Private methods
  private _subscribe<T = any>(
    event: string,
    handler: EventHandler<T> | AsyncEventHandler<T>,
    once: boolean,
    options: { priority?: number; filter?: (data: T, metadata: EventMetadata) => boolean } = {}
  ): string {
    const subscriptionId = this.generateSubscriptionId();
    const priority = options.priority ?? 0;

    const subscription: EventSubscription = {
      id: subscriptionId,
      event,
      handler,
      once,
      priority,
      filter: options.filter
    };

    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, []);
    }

    const eventSubscriptions = this.subscriptions.get(event)!;
    
    // Check max listeners
    if (eventSubscriptions.length >= this.maxListeners) {
      console.warn(`Max listeners (${this.maxListeners}) exceeded for event "${event}". Some listeners may be ignored.`);
    }

    if (once) {
      const originalHandler = handler;
      const wrappedHandler: EventHandler<T> = async (data, metadata) => {
        await (originalHandler as AsyncEventHandler<T>)(data, metadata);
        this.off(subscriptionId);
      };
      subscription.handler = wrappedHandler as any;
      subscription.syncHandler = (data, metadata) => {
        (originalHandler as EventHandler<T>)(data, metadata);
        this.off(subscriptionId);
      };
    }

    eventSubscriptions.push(subscription);
    this.updateStats();

    return subscriptionId;
  }

  private getSubscriptions(event: string): EventSubscription[] {
    const directSubscriptions = this.subscriptions.get(event) || [];
    return directSubscriptions;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `evt_${++this.eventCounter}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getTotalListeners(): number {
    return Array.from(this.subscriptions.values()).reduce((total, subs) => total + subs.length, 0);
  }

  private updateStats(): void {
    this.stats.totalListeners = this.getTotalListeners();
  }
}