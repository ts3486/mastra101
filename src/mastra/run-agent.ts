import { mastra } from './index.js';
import { transactionsTool } from './tools/transactions-tool.js';

async function run() {
  console.log('Agents available:', Object.keys((mastra as any).getAgents ? (mastra as any).getAgents() : (mastra as any).agents || {}));

  const agent = (mastra as any).getAgent ? (mastra as any).getAgent('financialAgent') : (mastra as any).agents?.financialAgent;
  if (!agent) {
    console.error('financialAgent not found');
    process.exit(1);
  }

  // If SHEET_URL is provided, call the transactions tool and print parsed transactions.
  const sheetUrl = process.env.SHEET_URL;
  if (sheetUrl) {
    console.log('\nRunning transactions tool for', sheetUrl);
    try {
  // transactionsTool.execute expects a ToolExecutionContext with `context` and `runtimeContext`.
  const result = await transactionsTool.execute({ context: { sheetUrl }, runtimeContext: {} } as any);
      console.log('Transactions parsed:', (result as any).transactions?.slice?.(0, 5));
    } catch (err: unknown) {
      console.error('transactionsTool failed:', (err as any)?.message ?? err);
    }
    process.exit(0);
  }

  // Simulate a dry-run: build an instruction and print what would be sent to the model
  const userPrompt = 'Summarize last month spending by category from the provided CSV.';
  console.log('\nSimulated run for financialAgent:');
  console.log('System instructions snippet:', agent.instructions?.slice?.(0, 300));
  console.log('User prompt:', userPrompt);

  console.log('\nSimulated response:');
  console.log('• Total spent: ¥123,456\n• Top categories: Food (35%), Transport (20%), Subscriptions (15%)\n• Advice: Review subscription services > ¥2,000/month');

  process.exit(0);
}

run().catch((e)=>{console.error(e); process.exit(1)})
