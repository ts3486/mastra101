import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { simpleMemory } from '../memory/simple-memory.js';

export const memoryTool = createTool({
  id: 'simple-memory',
  description: 'A simple in-memory store for agent memory (demo only).',
  inputSchema: z.object({
    action: z.enum(['write', 'readAll', 'clear']),
    namespace: z.string().optional(),
    key: z.string().optional(),
    value: z.string().optional(),
  }),
  outputSchema: z.union([
    z.object({ entry: z.any() }),
    z.object({ entries: z.array(z.any()) }),
    z.object({ ok: z.boolean() }),
  ]),
  execute: async (ctx) => {
    const input = (ctx as any).input ?? {};
    const { action, namespace = 'default', key, value } = input as any;
    if (action === 'write') {
      if (!key || typeof value !== 'string') {
        throw new Error('write requires key and value');
      }
      const entry = await simpleMemory.write(namespace, key, value);
      return { entry };
    }
    if (action === 'readAll') {
      const entries = await simpleMemory.readAll(namespace);
      return { entries };
    }
    if (action === 'clear') {
      await simpleMemory.clear(namespace);
      return { ok: true };
    }
    throw new Error('unknown action');
  },
});
