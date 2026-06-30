export interface EventMetadata {
  timestamp: number;
  eventId: string;
  source?: string;
}

export interface EventHandler<T = any> {
  (data: T, metadata: EventMetadata): void | Promise<void>;
}

export interface AsyncEventHandler<T = any> {
  (data: T, metadata: EventMetadata): Promise<void>;
}

export interface EventSubscription {
  id: string;
  event: string;
  handler: EventHandler | AsyncEventHandler;
  syncHandler?: EventHandler;
  once: boolean;
  priority: number;
  filter?: (data: any, metadata: EventMetadata) => boolean;
}

export interface EventOptions {
  source?: string;
  timestamp?: number;
}

export interface EmitOptions {
  filter?: (data: any) => boolean;
  limit?: number;
}

export interface ListenerCount {
  event: string;
  count: number;
}

export interface EventStats {
  totalEmitted: number;
  totalListeners: number;
  eventCounts: Map<string, number>;
}