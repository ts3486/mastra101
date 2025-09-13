import { mastra, mastraMemory } from './index.js';

export async function runDemo() {
  console.log('Playground memory demo: starting');

  // Ensure agent exists
  const agent = mastra.getAgent('financialAgent');
  if (!agent) throw new Error('financialAgent not found');

  // Step 1: user says a preference; save it to memory via mastraMemory
  const threadId = `playground-${Date.now()}`;
  const thread = {
    id: threadId,
    resourceId: 'playground-demo',
    title: 'playground demo',
    messages: [{ id: 'm1', role: 'user', content: 'My preferred currency is USD' }],
  };
  await (mastraMemory as any).saveThread({ thread });
  console.log('Saved preference to memory.');

  // Step 2: simulate agent reading memory and answering
  const threadsRes = await (mastraMemory as any).getThreadsByResourceId?.({ resourceId: 'playground-demo' });
  console.log('raw threads result:', threadsRes);
  const threads = threadsRes?.threads ?? threadsRes?.items ?? threadsRes;
  if (!threads || threads.length === 0) {
    throw new Error('No threads found in memory after save');
  }
  const found = threads.find((t: any) => t.id === threadId);
  if (!found) {
    throw new Error('Saved thread not found in memory');
  }
  console.log('Memory read back OK. thread:', found.id);

  // Optional: verify agent can access working memory instruction helper
  const wm = await (mastraMemory as any).getWorkingMemory?.({ resourceId: 'playground-demo' });
  console.log('Working memory snapshot (optional):', wm ? 'present' : 'none');

  console.log('Playground memory demo: SUCCESS');
}

// Note: this module exports `runDemo` for programmatic use. Use the script `scripts/run-playground-demo.mjs` to execute it.
