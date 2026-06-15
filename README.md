# eventkit-x - Zero-dependency Event System

A powerful, zero-dependency event system with advanced features like middleware, priority handling, wildcard events, and concurrency control.

## Features

- 🔥 **Zero Dependencies** - Pure TypeScript, no external dependencies
- 🚀 **High Performance** - Optimized for both sync and async operations
- 🎯 **Priority Handling** - Control execution order of event listeners
- 🌟 **Wildcard Events** - Catch all events with `*` wildcard
- 🔍 **Event Filtering** - Filter events before they reach listeners
- ⚡ **Middleware Support** - Transform, validate, and modify events
- 🏗️ **Event Groups** - Group related events with concurrency control
- 📊 **Statistics** - Track event emission and listener metrics
- 🔧 **TypeScript Support** - Full type safety and IntelliSense

## Installation

```bash
npm install eventkit-x
```

## Quick Start

### Basic Usage

```javascript
import { EventEmitter } from 'eventkit-x';

const emitter = new EventEmitter();

// Listen for events
emitter.on('user:login', (user) => {
  console.log(`User ${user.name} logged in`);
});

// Emit events
emitter.emit('user:login', { name: 'Alice', id: 1 });
```

### Once Listeners

```javascript
emitter.once('session:start', (session) => {
  console.log('Session started:', session.id);
});

// This listener will only be called once
emitter.emit('session:start', { id: 123 });
emitter.emit('session:start', { id: 456 }); // No effect
```

### Async Events

```javascript
emitter.onAsync('data:process', async (data) => {
  const result = await processData(data);
  console.log('Processed:', result);
});

await emitter.emit('data:process', { value: 42 });
```

### Priority Handling

```javascript
// Higher priority handlers run first
emitter.on('task:run', () => console.log('Low priority'), { priority: 1 });
emitter.on('task:run', () => console.log('High priority'), { priority: 10 });

// Output: High priority, Low priority
emitter.emit('task:run', {});
```

### Event Filtering

```javascript
emitter.on('user:create', (user) => {
  console.log('Creating user:', user.name);
}, {
  filter: (user) => user.age >= 18 // Only adults
});

emitter.emit('user:create', { name: 'Bob', age: 25 }); // Triggers
emitter.emit('user:create', { name: 'Alice', age: 16 }); // Ignored
```

### Wildcard Events

```javascript
emitter.on('*', (data, metadata) => {
  console.log(`Event ${metadata.event} fired with data:`, data);
});

emitter.on('user:*', (user) => {
  console.log('User event:', user);
});

emitter.emit('user:login', { id: 1 }); // Caught by both listeners
emitter.emit('system:shutdown', {}); // Caught only by wildcard
```

## Middleware Support

### Creating Event Bus with Middleware

```javascript
import { createEventBus, Middleware } from 'eventkit-x';

const bus = createEventBus({
  globalMiddleware: [
    Middleware.logger((event, data) => console.log(`${event}:`, data)),
    Middleware.transform((data) => ({ ...data, timestamp: Date.now() })),
    Middleware.validator(
      (data) => data.id !== undefined,
      (data) => new Error('Missing ID')
    )
  ]
});

bus.on('user:create', (user) => {
  console.log('Creating user:', user);
});

await bus.emit('user:create', { name: 'Charlie' }); // Throws error
await bus.emit('user:create', { name: 'Dave', id: 123 }); // Works
```

### Custom Middleware

```javascript
const bus = new EventMiddleware();

bus.use(async (context) => {
  console.log('Before event:', context.event);
  await context.next(); // Continue to next middleware/handler
  console.log('After event:', context.event);
});

bus.emit('test', 'data');
```

### Available Middleware

- `Middleware.logger(logger)` - Log all events
- `Middleware.validator(validator, errorFactory)` - Validate event data
- `Middleware.throttle(ms)` - Throttle event emissions
- `Middleware.debounce(ms)` - Debounce event emissions
- `Middleware.transform(transformer)` - Transform event data
- `Middleware.timing()` - Add timing information to metadata

## Event Groups

### Grouping Related Events

```javascript
import { EventGroup } from 'eventkit-x';

const group = new EventGroup({
  name: 'user-workflow',
  maxConcurrent: 2, // Limit concurrent operations
  errorHandler: (error, event) => console.error(`Error in ${event}:`, error)
});

// Add event handlers
group.addEvents({
  'user:validate': (user) => validateUser(user),
  'user:save': (user) => saveUser(user),
  'user:notify': (user) => sendNotification(user)
});

// Emit multiple events as a group
await group.emitGroup([
  { event: 'user:validate', data: { id: 1, name: 'Eve' } },
  { event: 'user:save', data: { id: 1, name: 'Eve' } },
  { event: 'user:notify', data: { id: 1, name: 'Eve' } }
]);
```

## Advanced Features

### Statistics and Monitoring

```javascript
const emitter = new EventEmitter();

emitter.emit('event1', 'data');
emitter.emit('event1', 'data');
emitter.emit('event2', 'data');

const stats = emitter.getStats();
console.log(stats);
// {
//   totalEmitted: 3,
//   totalListeners: 2,
//   eventCounts: Map { 'event1' => 2, 'event2' => 1 }
// }
```

### Error Handling

```javascript
emitter.on('error-prone', (data) => {
  if (data.fail) {
    throw new Error('Something went wrong');
  }
});

// Errors are caught and logged but don't stop other handlers
emitter.emit('error-prone', { fail: true });
emitter.emit('error-prone', { fail: false }); // Still works
```

### Removing Listeners

```javascript
const subId = emitter.on('event', handler);

// Remove specific listener
emitter.off(subId);

// Remove all listeners for an event
emitter.removeAllListeners('event');

// Remove all listeners
emitter.removeAllListeners();
```

## API Reference

### EventEmitter

#### Methods

- `on(event, handler, options?)` - Register event listener
- `once(event, handler, options?)` - Register one-time listener
- `onAsync(event, handler, options?)` - Register async event listener
- `onceAsync(event, handler, options?)` - Register one-time async listener
- `emit(event, data, options?)` - Emit event asynchronously
- `emitSync(event, data, options?)` - Emit event synchronously
- `off(subscriptionId)` - Remove listener by ID
- `removeAllListeners(event?)` - Remove all listeners
- `listenerCount(event)` - Get number of listeners for event
- `eventNames()` - Get all event names with listeners
- `setMaxListeners(n)` - Set maximum listeners per event
- `getStats()` - Get event statistics

#### Options

```typescript
interface SubscribeOptions {
  priority?: number; // Handler priority (higher = runs first)
  filter?: (data, metadata) => boolean; // Event filter
}

interface EmitOptions {
  filter?: (data) => boolean; // Emit filter
  limit?: number; // Maximum handlers to call
  source?: string; // Event source identifier
  timestamp?: number; // Custom timestamp
}
```

## Performance Tips

1. **Use `emitSync` for simple, synchronous operations** - It's faster than async
2. **Filter early** - Use event filters to avoid unnecessary processing
3. **Batch related events** - Use EventGroups for better performance
4. **Clean up unused listeners** - Remove listeners when they're no longer needed
5. **Use priority wisely** - Higher priority handlers run first, but don't overuse

## License

MIT