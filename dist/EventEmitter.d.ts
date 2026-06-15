import { EventHandler, AsyncEventHandler, EventMetadata, EventOptions, EmitOptions, EventStats } from './types.js';
export declare class EventEmitter {
    private subscriptions;
    private maxListeners;
    private eventCounter;
    private stats;
    /**
     * Register an event listener
     */
    on<T = any>(event: string, handler: EventHandler<T>, options?: {
        priority?: number;
        filter?: (data: T, metadata: EventMetadata) => boolean;
    }): string;
    /**
     * Register an event listener that will be removed after first emit
     */
    once<T = any>(event: string, handler: EventHandler<T>, options?: {
        priority?: number;
        filter?: (data: T, metadata: EventMetadata) => boolean;
    }): string;
    /**
     * Register an async event listener
     */
    onAsync<T = any>(event: string, handler: AsyncEventHandler<T>, options?: {
        priority?: number;
        filter?: (data: T, metadata: EventMetadata) => boolean;
    }): string;
    /**
     * Register an async event listener that will be removed after first emit
     */
    onceAsync<T = any>(event: string, handler: AsyncEventHandler<T>, options?: {
        priority?: number;
        filter?: (data: T, metadata: EventMetadata) => boolean;
    }): string;
    /**
     * Emit an event to all listeners
     */
    emit<T = any>(event: string, data: T, options?: EmitOptions & EventOptions): Promise<number>;
    /**
     * Emit an event synchronously
     */
    emitSync<T = any>(event: string, data: T, options?: EmitOptions & EventOptions): number;
    /**
     * Remove an event listener by subscription ID
     */
    off(subscriptionId: string): boolean;
    /**
     * Remove all listeners for an event, or all listeners if no event specified
     */
    removeAllListeners(event?: string): number;
    /**
     * Get the number of listeners for an event
     */
    listenerCount(event: string): number;
    /**
     * Get all event names that have listeners
     */
    eventNames(): string[];
    /**
     * Set maximum number of listeners per event
     */
    setMaxListeners(n: number): void;
    /**
     * Get event statistics
     */
    getStats(): EventStats;
    /**
     * Clear event statistics
     */
    clearStats(): void;
    private _subscribe;
    private getSubscriptions;
    private generateSubscriptionId;
    private generateEventId;
    private getTotalListeners;
    private updateStats;
}
//# sourceMappingURL=EventEmitter.d.ts.map