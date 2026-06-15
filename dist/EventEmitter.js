export class EventEmitter {
    constructor() {
        this.subscriptions = new Map();
        this.maxListeners = 100;
        this.eventCounter = 0;
        this.stats = {
            totalEmitted: 0,
            totalListeners: 0,
            eventCounts: new Map()
        };
    }
    /**
     * Register an event listener
     */
    on(event, handler, options = {}) {
        return this._subscribe(event, handler, false, options);
    }
    /**
     * Register an event listener that will be removed after first emit
     */
    once(event, handler, options = {}) {
        return this._subscribe(event, handler, true, options);
    }
    /**
     * Register an async event listener
     */
    onAsync(event, handler, options = {}) {
        return this._subscribe(event, handler, false, options);
    }
    /**
     * Register an async event listener that will be removed after first emit
     */
    onceAsync(event, handler, options = {}) {
        return this._subscribe(event, handler, true, options);
    }
    /**
     * Emit an event to all listeners
     */
    async emit(event, data, options = {}) {
        const subscriptions = this.getSubscriptions(event);
        const wildcardSubscriptions = this.getSubscriptions('*');
        const allSubscriptions = [...subscriptions, ...wildcardSubscriptions];
        if (allSubscriptions.length === 0) {
            return 0;
        }
        // Sort by priority (higher priority first)
        allSubscriptions.sort((a, b) => b.priority - a.priority);
        const metadata = {
            timestamp: options.timestamp ?? Date.now(),
            eventId: this.generateEventId(),
            source: options.source
        };
        let emittedCount = 0;
        let remainingLimit = options.limit ?? Infinity;
        for (const subscription of allSubscriptions) {
            if (remainingLimit <= 0)
                break;
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
            }
            catch (error) {
                // Error handling for individual handler
                console.error(`Error in event handler for "${event}":`, error);
            }
        }
        // Update stats
        this.stats.totalEmitted++;
        this.stats.eventCounts.set(event, (this.stats.eventCounts.get(event) || 0) + 1);
        return emittedCount;
    }
    /**
     * Emit an event synchronously
     */
    emitSync(event, data, options = {}) {
        const subscriptions = this.getSubscriptions(event);
        const wildcardSubscriptions = this.getSubscriptions('*');
        const allSubscriptions = [...subscriptions, ...wildcardSubscriptions];
        if (allSubscriptions.length === 0) {
            return 0;
        }
        // Sort by priority (higher priority first)
        allSubscriptions.sort((a, b) => b.priority - a.priority);
        const metadata = {
            timestamp: options.timestamp ?? Date.now(),
            eventId: this.generateEventId(),
            source: options.source
        };
        let emittedCount = 0;
        let remainingLimit = options.limit ?? Infinity;
        for (const subscription of allSubscriptions) {
            if (remainingLimit <= 0)
                break;
            // Apply filter if exists
            if (subscription.filter && !subscription.filter(data, metadata)) {
                continue;
            }
            // Emit limit check
            if (options.filter && !options.filter(data)) {
                continue;
            }
            try {
                subscription.handler(data, metadata);
                emittedCount++;
                remainingLimit--;
            }
            catch (error) {
                console.error(`Error in event handler for "${event}":`, error);
            }
        }
        // Update stats
        this.stats.totalEmitted++;
        this.stats.eventCounts.set(event, (this.stats.eventCounts.get(event) || 0) + 1);
        return emittedCount;
    }
    /**
     * Remove an event listener by subscription ID
     */
    off(subscriptionId) {
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
    removeAllListeners(event) {
        if (event) {
            const count = this.subscriptions.get(event)?.length || 0;
            this.subscriptions.delete(event);
            this.updateStats();
            return count;
        }
        else {
            const count = this.getTotalListeners();
            this.subscriptions.clear();
            this.updateStats();
            return count;
        }
    }
    /**
     * Get the number of listeners for an event
     */
    listenerCount(event) {
        return this.getSubscriptions(event).length;
    }
    /**
     * Get all event names that have listeners
     */
    eventNames() {
        return Array.from(this.subscriptions.keys());
    }
    /**
     * Set maximum number of listeners per event
     */
    setMaxListeners(n) {
        this.maxListeners = n;
    }
    /**
     * Get event statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Clear event statistics
     */
    clearStats() {
        this.stats = {
            totalEmitted: 0,
            totalListeners: 0,
            eventCounts: new Map()
        };
    }
    // Private methods
    _subscribe(event, handler, once, options = {}) {
        const subscriptionId = this.generateSubscriptionId();
        const priority = options.priority ?? 0;
        const subscription = {
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
        const eventSubscriptions = this.subscriptions.get(event);
        // Check max listeners
        if (eventSubscriptions.length >= this.maxListeners) {
            console.warn(`Max listeners (${this.maxListeners}) exceeded for event "${event}". Some listeners may be ignored.`);
        }
        eventSubscriptions.push(subscription);
        this.updateStats();
        // Clean up once subscriptions after emit
        if (once) {
            const originalHandler = handler;
            const wrappedHandler = async (data, metadata) => {
                await originalHandler(data, metadata);
                this.off(subscriptionId);
            };
            subscription.handler = wrappedHandler;
        }
        return subscriptionId;
    }
    getSubscriptions(event) {
        const directSubscriptions = this.subscriptions.get(event) || [];
        return directSubscriptions;
    }
    generateSubscriptionId() {
        return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateEventId() {
        return `evt_${++this.eventCounter}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getTotalListeners() {
        return Array.from(this.subscriptions.values()).reduce((total, subs) => total + subs.length, 0);
    }
    updateStats() {
        this.stats.totalListeners = this.getTotalListeners();
    }
}
//# sourceMappingURL=EventEmitter.js.map