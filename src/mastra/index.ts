
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Memory } from '@mastra/memory';
import { weatherWorkflow } from './workflows/weather-workflow.js';
import { weatherAgent } from './agents/weather-agent.js';
import { financialAgent } from './agents/financial-agent.js';
import { memoryTool } from './tools/memory-tool.js';

const libsqlForMemory = new LibSQLStore({
  // Use a file-backed DB so memory persists across restarts in this demo.
  url: 'file:./mastra-memory.db',
});

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { weatherAgent, financialAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ':memory:',
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});

// Create a Memory instance backed by LibSQL for demo purposes. Export it so agents/tools can import when needed.
export const mastraMemory = new Memory({ storage: libsqlForMemory });

// Export memoryTool for convenience (Playground/other scripts can import it)
export { memoryTool };

// Dev helper: auto-initialize the local mastra-memory.db when running in non-production
// This keeps the repo friendly for fresh clones. Be conservative: only run when
// NODE_ENV !== 'production' and when the DB file appears missing.
(async function autoInitDb() {
  try {
    if (process.env.NODE_ENV === 'production') return;
    // Only attempt if the DB file doesn't exist yet.
    // Use fs to check for the file.
    const fs = await import('fs');
    const path = './mastra-memory.db';
    if (!fs.existsSync(path)) {
      // Try to run the init script if present
      try {
        // dynamic import of script (it exits the process when done, so call in a child process would be safer)
        // To avoid exiting the current process, spawn a child node process to run the script.
        const { spawn } = await import('child_process');
        const node = process.execPath;
        const script = './scripts/init-mastra-db.js';
        const child = spawn(node, [script], { stdio: 'inherit' });
        child.on('error', (err) => {
          console.warn('Auto-init DB script spawn error:', err?.message ?? err);
        });
      } catch (e) {
        console.warn('Could not auto-init DB:', String(e));
      }
    }
  } catch (e) {
    // Non-fatal
  }
})();
