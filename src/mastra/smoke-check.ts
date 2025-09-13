import { mastra } from './index.js';

(async function run(){
  // Print a small summary without calling external APIs
  const agents = typeof (mastra as any).getAgents === 'function' ? (mastra as any).getAgents() : (mastra as any).agents || {};
  const workflows = typeof (mastra as any).getWorkflows === 'function' ? (mastra as any).getWorkflows() : (mastra as any).workflows || {};

  console.log('Mastra initialized with agents:', Object.keys(agents));
  console.log('Mastra initialized with workflows:', Object.keys(workflows));
  process.exit(0);
})();
