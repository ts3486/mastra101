import { mastra } from './index.js';

async function main() {
  const agent = mastra.getAgent('financialAgent');
  if (!agent) {
    console.error('financialAgent not found');
    process.exit(1);
  }

  console.log('Invoking agent to store a preference...');
  // Simulate writing a memory entry via the agent's memory API if present
  try {
    if ((agent as any).memory?.saveThread) {
      const thread = {
        id: `agent-demo-${Date.now()}`,
        resourceId: 'agent-demo',
        title: 'agent demo thread',
        messages: [{ id: 'm1', role: 'user', content: 'My favorite currency is JPY' }],
      };
      await (agent as any).memory.saveThread({ thread });
      console.log('Saved thread via agent.memory');
    } else {
      console.log('No agent.memory.saveThread available - falling back to mastraMemory export');
      const { mastraMemory } = await import('./index.js');
      await (mastraMemory as any).saveThread({ thread: { id: `agent-demo-${Date.now()}`, resourceId: 'agent-demo', title: 'agent demo', messages: [{ id: 'm1', role: 'user', content: 'My favorite currency is JPY' }] } });
      console.log('Saved thread via mastraMemory');
    }
  } catch (e) {
    console.error('failed to save thread:', e);
  }

  console.log('Reading back memory entries (threads for resource agent-demo):');
  try {
    const { mastraMemory } = await import('./index.js');
    const threads = await (mastraMemory as any).getThreadsByResourceId?.('agent-demo');
    console.log('Found threads:', threads?.threads?.length ?? 0);
    console.log('Threads sample:', threads?.threads?.slice?.(0, 2));
  } catch (e) {
    console.error('failed to read threads:', e);
  }
}

if (require.main === module) {
  main().then(() => console.log('Done')).catch((err) => { console.error(err); process.exit(1); });
}
