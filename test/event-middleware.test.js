import { EventMiddleware, createEventBus, Middleware } from '../dist/index.js';
import { strict as assert } from 'assert';

// Test basic middleware
{
  const middleware = new EventMiddleware();
  const order = [];
  
  middleware.use(async (context) => {
    order.push('before');
    await context.next();
    order.push('after');
  });

  middleware.on('test', (data) => {
    order.push('handler');
    assert.equal(data, 'original');
  });

  await middleware.emit('test', 'original');
  assert.deepEqual(order, ['before', 'handler', 'after']);
}

// Test transform middleware
{
  const middleware = new EventMiddleware();
  
  middleware.use(Middleware.transform((data) => data.toUpperCase()));
  
  middleware.on('test', (data) => {
    assert.equal(data, 'HELLO');
  });

  await middleware.emit('test', 'hello');
}

// Test validation middleware
{
  const middleware = new EventMiddleware();
  
  middleware.use(Middleware.validator(
    (data) => typeof data === 'string' && data.length > 3,
    (data) => new Error(`String too short: ${data}`)
  ));

  middleware.on('test', (data) => {
    assert.fail('Should not reach here');
  });

  try {
    await middleware.emit('test', 'hi');
    assert.fail('Should have thrown error');
  } catch (error) {
    assert.equal(error.message, 'String too short: hi');
  }
}

// Test throttle middleware
{
  const middleware = new EventMiddleware();
  const order = [];
  
  middleware.use(Middleware.throttle(50));
  
  middleware.on('test', () => order.push('handler'));

  const start = Date.now();
  await middleware.emit('test', '1');
  await middleware.emit('test', '2');
  await middleware.emit('test', '3');
  const end = Date.now();
  
  // Throttle should skip events 2 and 3 (within 50ms window)
  assert.ok(end - start < 50);
  assert.equal(order.length, 1); // Only one event should fire
}

// Test debounce middleware
await (async () => {
  await new Promise((resolve) => {
    const middleware = new EventMiddleware();
    const order = [];
    
    middleware.use(Middleware.debounce(50));
    
    middleware.on('test', () => order.push('handler'));

    middleware.emit('test', '1');
    middleware.emit('test', '2');
    middleware.emit('test', '3');
    
    // After debounce delay, handler should fire once
    setTimeout(() => {
      assert.equal(order.length, 1);
      resolve();
    }, 100);
  });
})();

// Test stop propagation
{
  const middleware = new EventMiddleware();
  const order = [];
  
  middleware.use(async (context) => {
    order.push('middleware1');
    if (context.data === 'stop') {
      context.stop();
      return;
    }
    await context.next();
  });
  
  middleware.use(async (context) => {
    order.push('middleware2');
    await context.next();
  });

  middleware.on('test', () => order.push('handler'));

  await middleware.emit('test', 'continue');
  await middleware.emit('test', 'stop');
  
  // First emit: middleware1 → middleware2 → handler
  // Second emit: middleware1 (stops, middleware2 and handler skipped)
  assert.deepEqual(order, ['middleware1', 'middleware2', 'handler', 'middleware1']);
}

// Test createEventBus
{
  const bus = createEventBus({
    globalMiddleware: [
      async (context) => {
        context.data = `processed_${context.data}`;
        await context.next();
      }
    ]
  });

  bus.on('test', (data) => {
    assert.equal(data, 'processed_hello');
  });

  await bus.emit('test', 'hello');
}

// Test timing middleware
{
  await new Promise((resolve) => {
    const middleware = new EventMiddleware();
    
    middleware.use(Middleware.timing());
    
    middleware.on('test', (data, metadata) => {
      assert.ok(metadata.timestamp > 0);
      assert.ok(typeof metadata.timestamp === 'number');
      resolve();
    });

    middleware.emit('test', 'data');
  });
}

console.log('✅ All EventMiddleware tests passed!');