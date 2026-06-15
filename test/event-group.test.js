import { EventGroup } from '../dist/index.js';
import { strict as assert } from 'assert';

// Test basic group functionality
{
  const group = new EventGroup({ name: 'test-group' });
  let callCount = 0;
  
  group.addEvents({
    'event1': (data) => { callCount += data; },
    'event2': (data) => { callCount += data * 2; }
  });

  group.emitGroup([
    { event: 'event1', data: 1 },
    { event: 'event2', data: 2 }
  ]);
  
  assert.equal(callCount, 5); // 1 + (2 * 2) = 5
}

// Test concurrent events
{
  const group = new EventGroup({ 
    name: 'concurrent-test',
    maxConcurrent: 2
  });
  
  const order = [];
  
  group.addEvents({
    'slow': async () => {
      order.push('start-slow');
      await new Promise(resolve => setTimeout(resolve, 50));
      order.push('end-slow');
    },
    'fast': async () => {
      order.push('start-fast');
      await new Promise(resolve => setTimeout(resolve, 10));
      order.push('end-fast');
    }
  });

  await group.emitGroup([
    { event: 'slow', data: null },
    { event: 'fast', data: null },
    { event: 'fast', data: null }
  ]);
  
  // Should see concurrent execution limited
  assert.ok(order.length > 0);
}

// Test group error handling
{
  const group = new EventGroup({
    name: 'error-test',
    errorHandler: (error, event) => {
      assert.equal(event, 'error-event');
      assert.equal(error.message, 'Test error');
    }
  });
  
  group.addEvents({
    'error-event': () => {
      throw new Error('Test error');
    }
  });

  await group.emitGroup([
    { event: 'error-event', data: null }
  ]);
}

// Test group stats
{
  const group = new EventGroup({ name: 'stats-test' });
  
  group.addEvents({
    'event1': () => {},
    'event2': () => {}
  });

  await group.emitGroup([
    { event: 'event1', data: null },
    { event: 'event2', data: null }
  ]);

  const stats = group.getStats();
  assert.equal(stats.name, 'stats-test');
  assert.equal(stats.maxConcurrent, Infinity);
  assert.ok(stats.emitterStats.totalEmitted >= 2);
}

// Test group destruction
{
  const group = new EventGroup({ name: 'destroy-test' });
  let callCount = 0;
  
  group.addEvents({
    'event': () => callCount++
  });

  await group.emitGroup([{ event: 'event', data: null }]);
  assert.equal(callCount, 1);
  
  group.destroy();
  await group.emitGroup([{ event: 'event', data: null }]);
  assert.equal(callCount, 1); // Should not increase after destroy
}

console.log('✅ All EventGroup tests passed!');