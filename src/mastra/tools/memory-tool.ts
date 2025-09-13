import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
// mastraMemory is imported dynamically inside execute to avoid circular imports with index.ts

export const memoryTool = createTool({
  id: 'memory-tool',
  description: 'A tool that exposes the demo persistent memory (mastraMemory).',
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
  const input = (ctx as any).input ?? (ctx as any) ?? {};
  const { action, resourceId = 'tool-memory', threadTitle = 'tool thread', message = '' } = input as any;
  // Lazily import mastraMemory to avoid circular dependency with index.ts
  const { mastraMemory } = await import('../index.js');
  // The tool exposes a few convenience actions that map to mastraMemory API.
  if (action === 'write') {
      // Save a short thread with a single user message.
      const thread = {
        id: `tool-${Date.now()}`,
        resourceId,
        title: threadTitle,
        messages: [{ id: `m-${Date.now()}`, role: 'user', content: message }],
      };
  const saved = await (mastraMemory as any).saveThread?.({ thread });
      return { entry: saved ?? thread };
    }
    if (action === 'readAll') {
      const res = await (mastraMemory as any).getThreadsByResourceId?.({ resourceId });
      // Normalize possible shapes
      const threads = (res && (res.threads || res.items || res)) ?? [];
      return { entries: threads };
    }
    if (action === 'clear') {
      // No direct clear API; as a demo, fetch threads and delete by id if deleteThread exists.
      const res = await (mastraMemory as any).getThreadsByResourceId?.({ resourceId });
      const threads = (res && (res.threads || res.items || res)) ?? [];
      if ((mastraMemory as any).deleteThread) {
        for (const t of threads) {
          await (mastraMemory as any).deleteThread?.({ threadId: t.id });
        }
      }
      return { ok: true };
    }
    throw new Error('unknown action');
  },
});
