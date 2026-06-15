import { EventEmitter } from '../dist/index.js';
import { strict as assert } from 'assert';

// Test basic event emission
{
  const emitter = new EventEmitter();
  let callCount = 0;
  
  emitter.on('test', (data) => {
    callCount++;
    assert.equal(data, 'hello');
  });

  emitter.emit('test', 'hello');
  assert.equal(callCount, 1);
}

// Test once
{
  const emitter = new EventEmitter();
  let callCount = 0;
  
  emitter.once('test', (data) => {
    callCount++;
    assert.equal(data, 'hello');
  });

  emitter.emit('test', 'hello');
  emitter.emit('test', 'hello');
  assert.equal(callCount, 1);
}

// Test multiple listeners
{
  const emitter = new EventEmitter();
  let callCount = 0;
  
  emitter.on('test', () => callCount++);
  emitter.on('test', () => callCount++);
  
  emitter.emit('test', 'data');
  assert.equal(callCount, 2);
}

// Test async events
{
  const emitter = new EventEmitter();
  let callCount = 0;
  
  emitter.onAsync('test', async (data) => {
    callCount++;
    await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(data, 'hello');
  });

  await emitter.emit('test', 'hello');
  assert.equal(callCount, 1);
}

// Test wildcard events
{
  const emitter = new EventEmitter();
  let callCount = 0;
  
  emitter.on('*', (data) => {
    callCount++;
    assert.equal(data, 'wildcard');
  });
  
  emitter.on('specific', (data) => {
    callCount++;
    assert.equal(data, 'specific');
  });

  emitter.emit('specific', 'specific');
  emitter.emit('other', 'wildcard');
  emitter.emit('another', 'wildcard');
  assert.equal(callCount, 3);
}

// Test priority
{
  const emitter = new EventEmitter();
  const order = [];
  
  emitter.on('test', () => order.push('low'), { priority: 1 });
  emitter.on('test', () => order.push('high'), { priority: 10 });
  emitter.on('test', () => order.push('medium'), { priority: 5 });
  
  emitter.emit('test', 'data');
  assert.deepEqual(order, ['high', 'medium', 'low']);
}

// Test event filters
{
  const emitter = new EventEmitter();
  let callCount = 0;
  
  emitter.on('test', (data) => callCount++, {
    filter: (data) => data > 5
  });

  emitter.emit('test', 3);  // Should not trigger
  emitter.emit('test', 7);  // Should trigger
  assert.equal(callCount, 1);
}

// Test off functionality
{
  const emitter = new EventEmitter();
  let callCount = 0;
  
  const subId = emitter.on('test', () => callCount++);
  emitter.emit('test', 'data');
  assert.equal(callCount, 1);
  
  emitter.off(subId);
  emitter.emit('test', 'data');
  assert.equal(callCount, 1);
}

// Test remove all listeners
{
  const emitter = new EventEmitter();
  let callCount = 0;
  
  emitter.on('test', () => callCount++);
  emitter.on('test', () => callCount++);
  emitter.on('other', () => callCount++);
  
  emitter.removeAllListeners('test');
  emitter.emit('test', 'data');
  emitter.emit('other', 'data');
  assert.equal(callCount, 1);
}

// Test stats
{
  const emitter = new EventEmitter();
  
  emitter.emit('test1', 'data');
  emitter.emit('test1', 'data');
  emitter.emit('test2', 'data');
  
  const stats = emitter.getStats();
  assert.equal(stats.totalEmitted, 3);
  assert.equal(stats.eventCounts.get('test1'), 2);
  assert.equal(stats.eventCounts.get('test2'), 1);
}

console.log('✅ All EventEmitter tests passed!');