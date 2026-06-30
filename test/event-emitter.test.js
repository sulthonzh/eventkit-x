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

  emitter.emitSync('test', 'hello');
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

  emitter.emitSync('test', 'hello');
  emitter.emitSync('test', 'hello');
  assert.equal(callCount, 1);
}

// Test multiple listeners
{
  const emitter = new EventEmitter();
  let callCount = 0;
  
  emitter.on('test', () => callCount++);
  emitter.on('test', () => callCount++);
  
  emitter.emitSync('test', 'data');
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
  let wildcardCount = 0;
  let specificCount = 0;
  
  emitter.on('*', () => wildcardCount++);
  emitter.on('specific', () => specificCount++);

  emitter.emitSync('specific', 'specific');
  emitter.emitSync('other', 'wildcard');
  emitter.emitSync('another', 'wildcard');
  // wildcard fires for all 3, specific fires for 1
  assert.equal(wildcardCount, 3);
  assert.equal(specificCount, 1);
}

// Test priority
{
  const emitter = new EventEmitter();
  const order = [];
  
  emitter.on('test', () => order.push('low'), { priority: 1 });
  emitter.on('test', () => order.push('high'), { priority: 10 });
  emitter.on('test', () => order.push('medium'), { priority: 5 });
  
  emitter.emitSync('test', 'data');
  assert.deepEqual(order, ['high', 'medium', 'low']);
}

// Test event filters
{
  const emitter = new EventEmitter();
  let callCount = 0;
  
  emitter.on('test', (data) => callCount++, {
    filter: (data) => data > 5
  });

  emitter.emitSync('test', 3);  // Should not trigger
  emitter.emitSync('test', 7);  // Should trigger
  assert.equal(callCount, 1);
}

// Test off functionality
{
  const emitter = new EventEmitter();
  let callCount = 0;
  
  const subId = emitter.on('test', () => callCount++);
  emitter.emitSync('test', 'data');
  assert.equal(callCount, 1);
  
  emitter.off(subId);
  emitter.emitSync('test', 'data');
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
  emitter.emitSync('test', 'data');
  emitter.emitSync('other', 'data');
  assert.equal(callCount, 1);
}

// Test stats
{
  const emitter = new EventEmitter();
  
  emitter.emitSync('test1', 'data');
  emitter.emitSync('test1', 'data');
  emitter.emitSync('test2', 'data');
  
  const stats = emitter.getStats();
  assert.equal(stats.totalEmitted, 3);
  assert.equal(stats.eventCounts.get('test1'), 2);
  assert.equal(stats.eventCounts.get('test2'), 1);
}

console.log('✅ All EventEmitter tests passed!');