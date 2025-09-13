import test from 'node:test';
import assert from 'node:assert/strict';

// Ensure compiled code is imported so dist/ exports are available
await import('../dist/index.js');
const { mastraMemory } = await import('../dist/index.js');

test('mastraMemory save/read roundtrip', async (t) => {
  // Create a unique resource for the test
  const resourceId = `test-resource-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
  const thread = {
    id: `test-thread-${Date.now()}`,
    resourceId,
    title: 'unit test thread',
    messages: [{ id: 'm1', role: 'user', content: 'hello test' }],
  };

  // Save thread
  const saved = await mastraMemory.saveThread?.({ thread });
  assert.ok(saved, 'saveThread returned a value');
  assert.strictEqual(saved.id ?? thread.id, thread.id, 'saved thread id matches');

  // Read back
  const res = await mastraMemory.getThreadsByResourceId?.({ resourceId });
  const threads = (res && (res.threads || res.items || res)) ?? [];
  assert.ok(Array.isArray(threads), 'threads is array');
  const found = threads.find((r) => r.id === thread.id);
  assert.ok(found, 'Saved thread found in getThreadsByResourceId');
});
