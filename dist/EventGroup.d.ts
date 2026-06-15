import { EventMetadata } from './types.js';
export interface GroupOptions {
    name: string;
    maxConcurrent?: number;
    errorHandler: (error: Error, event: string, data: any, metadata: EventMetadata) => void | undefined;
}
export declare class EventGroup {
    private emitter;
    private name;
    private maxConcurrent;
    private errorHandler?;
    private activeOperations;
    private subscriptionIds;
    constructor(options: GroupOptions);
    /**
     * Add events to the group
     */
    addEvents(events: {
        [key: string]: any;
    }): void;
    /**
     * Emit events within the group with concurrency control
     */
    emitGroup(events: Array<{
        event: string;
        data: any;
        options?: {
            priority?: number;
            source?: string;
        };
    }>): Promise<number>;
    /**
     * Emit a single event with concurrency control
     */
    private emitWithConcurrency;
    /**
     * Get group statistics
     */
    getStats(): {
        name: string;
        activeOperations: number;
        maxConcurrent: number;
        emitterStats: any;
    };
    /**
     * Clean up all subscriptions
     */
    destroy(): void;
}
//# sourceMappingURL=EventGroup.d.ts.map