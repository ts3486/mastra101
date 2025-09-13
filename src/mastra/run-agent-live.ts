import { mastra } from './index.js';
import { transactionsTool } from './tools/transactions-tool.js';

async function runLive() {
  const agent = mastra.getAgent ? mastra.getAgent('financialAgent') : (mastra as any).agents?.financialAgent;
  if (!agent) {
    console.error('financialAgent not found');
    process.exit(1);
  }

  // Instruct the agent to fetch transactions using the tool and summarize last month spending
  const prompt = `Please fetch the transactions using the get-transactions tool (provide SHEET_URL or sheetId+gid in execution context) and summarize last month's spending by category. Output a short CSV: category,total.`;

  console.log('Invoking agent (this will call the model and tools)');

  try {
    // First, fetch transactions directly using the tool to avoid model hallucination about URLs.
    const sheetUrl = process.env.SHEET_URL as string | undefined;
    if (!sheetUrl) {
      throw new Error('SHEET_URL not set in environment');
    }

    console.log('Fetching transactions directly from sheet...');
    let transactionsResult: any;
    try {
      transactionsResult = await transactionsTool.execute({ context: { sheetUrl }, runtimeContext: {} } as any);
      console.log('Fetched', (transactionsResult?.transactions || []).length, 'transactions');
    } catch (toolErr: any) {
      console.error('transactionsTool failed:', toolErr?.message ?? toolErr);
      throw toolErr;
    }

    // Pass the parsed transactions to the agent and instruct it not to call tools.
    const userPromptWithData = `DO NOT CALL ANY TOOLS. I am providing the parsed transactions JSON below. Using only this data, summarize last month's spending by category and output a short CSV with header: category,total.\n\nDATA:\n${JSON.stringify(transactionsResult.transactions || [])}`;

    const response = await agent.stream([
      { role: 'user', content: userPromptWithData }
    ], {});

    // Await common promise fields or stream
    if (response && response.textStream) {
      for await (const chunk of response.textStream) {
        process.stdout.write(chunk);
      }
    } else if (response && response.textPromise) {
      const txt = await response.textPromise;
      console.log(txt);
    } else if (response && response.responsePromise) {
      const resp = await response.responsePromise;
      console.log(resp?.result ?? resp);
    } else {
      console.log('Agent produced no text output.');
    }
    console.log('\n\nDone.');
  } catch (err: any) {
    console.error('Agent run failed:', err?.message ?? err);
  }

  process.exit(0);
}

runLive().catch((e)=>{console.error(e); process.exit(1)})
