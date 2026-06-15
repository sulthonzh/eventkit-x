import { EventEmitter } from './EventEmitter.js';
export class EventGroup {
    constructor(options) {
        this.activeOperations = new Set();
        this.subscriptionIds = [];
        this.emitter = new EventEmitter();
        this.name = options.name;
        this.maxConcurrent = options.maxConcurrent || Infinity;
        this.errorHandler = options.errorHandler ?? undefined;
    }
    /**
     * Add events to the group
     */
    addEvents(events) {
        for (const [event, handler] of Object.entries(events)) {
            this.emitter.on(event, handler);
        }
    }
    /**
     * Emit events within the group with concurrency control
     */
    async emitGroup(events) {
        const results = await Promise.allSettled(events.map(({ event, data, options }) => this.emitWithConcurrency(event, data, options)));
        let successCount = 0;
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                successCount++;
            }
            else {
                console.error(`Event ${events[index].event} failed:`, result.reason);
            }
        });
        return successCount;
    }
    /**
     * Emit a single event with concurrency control
     */
    async emitWithConcurrency(event, data, options) {
        const operationId = `${event}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        // Wait for available slot
        while (this.activeOperations.size >= this.maxConcurrent) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        this.activeOperations.add(operationId);
        try {
            await this.emitter.emit(event, data, options);
        }
        catch (error) {
            if (this.errorHandler) {
                const metadata = {
                    timestamp: Date.now(),
                    eventId: `group_evt_${Date.now()}`,
                    source: this.name
                };
                this.errorHandler?.(error, event, data, metadata);
            }
            throw error;
        }
        finally {
            this.activeOperations.delete(operationId);
        }
    }
    /**
     * Get group statistics
     */
    getStats() {
        return {
            name: this.name,
            activeOperations: this.activeOperations.size,
            maxConcurrent: this.maxConcurrent,
            emitterStats: this.emitter.getStats()
        };
    }
    /**
     * Clean up all subscriptions
     */
    destroy() {
        this.subscriptionIds.forEach(id => this.emitter.off(id));
        this.subscriptionIds = [];
        this.activeOperations.clear();
    }
}
//# sourceMappingURL=EventGroup.js.map