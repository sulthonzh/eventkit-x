import { EventEmitter } from './EventEmitter.js';
import { EventSubscription, EventMetadata } from './types.js';

export interface GroupOptions {
  name: string;
  maxConcurrent?: number;
  errorHandler: (error: Error, event: string, data: any, metadata: EventMetadata) => void | undefined;
}

export class EventGroup {
  private emitter: EventEmitter;
  private name: string;
  private maxConcurrent: number;
  private errorHandler?: (error: Error, event: string, data: any, metadata: EventMetadata) => void;
  private activeOperations: Set<string> = new Set();
  private subscriptionIds: string[] = [];

  constructor(options: GroupOptions) {
    this.emitter = new EventEmitter();
    this.name = options.name;
    this.maxConcurrent = options.maxConcurrent || Infinity;
    this.errorHandler = options.errorHandler ?? undefined;
  }

  /**
   * Add events to the group
   */
  addEvents(events: { [key: string]: any }): void {
    for (const [event, handler] of Object.entries(events)) {
      const subId = this.emitter.on(event, handler);
      this.subscriptionIds.push(subId);
    }
  }

  /**
   * Emit events within the group with concurrency control
   */
  async emitGroup(events: Array<{
    event: string;
    data: any;
    options?: { priority?: number; source?: string };
  }>): Promise<number> {
    const results = await Promise.allSettled(
      events.map(({ event, data, options }) => 
        this.emitWithConcurrency(event, data, options)
      )
    );

    let successCount = 0;
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successCount++;
      } else {
        console.error(`Event ${events[index].event} failed:`, result.reason);
      }
    });

    return successCount;
  }

  /**
   * Emit a single event with concurrency control
   */
  private async emitWithConcurrency(event: string, data: any, options?: { priority?: number; source?: string }): Promise<void> {
    const operationId = `${event}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Wait for available slot
    while (this.activeOperations.size >= this.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.activeOperations.add(operationId);

    try {
      await this.emitter.emit(event, data, options);
    } catch (error) {
      if (this.errorHandler) {
        const metadata = {
          timestamp: Date.now(),
          eventId: `group_evt_${Date.now()}`,
          source: this.name
        };
        this.errorHandler?.(error as Error, event, data, metadata);
      }
      throw error;
    } finally {
      this.activeOperations.delete(operationId);
    }
  }

  /**
   * Get group statistics
   */
  getStats(): {
    name: string;
    activeOperations: number;
    maxConcurrent: number;
    emitterStats: any;
  } {
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
  destroy(): void {
    this.subscriptionIds.forEach(id => this.emitter.off(id));
    this.subscriptionIds = [];
    this.activeOperations.clear();
  }
}