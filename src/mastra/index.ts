
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { weatherWorkflow } from './workflows/weather-workflow.js';
import { weatherAgent } from './agents/weather-agent.js';
import { financialAgent } from './agents/financial-agent.js';
import { memoryTool } from './tools/memory-tool.js';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { weatherAgent, financialAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});

// Export memoryTool for convenience (Playground/other scripts can import it)
export { memoryTool };
