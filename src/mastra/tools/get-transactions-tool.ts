import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const getTransactionsTool = createTool({
  id: 'get-transactions',
  description: 'Get transaction data from Google Sheets',
  inputSchema: z.object({
    sheetUrl: z.string().optional(),
  }), // Optional sheetUrl; if omitted we will fall back to process.env.SHEET_URL
  outputSchema: z.object({
    csvData: z.string(),
  }),
  execute: async ({ context }) => {
    const sheetUrl = (context as any)?.sheetUrl ?? process.env.SHEET_URL;
    return await getTransactions(sheetUrl);
  },
});

const getTransactions = async (sheetUrl?: string) => {
  // This URL points to a public Google Sheet with transaction data
  const url = sheetUrl ?? 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTQWaCzJAFsF4owWRHQRLo4G0-ERv31c74OOZFnqLiTLaP7NweoiX7IXvzQud2H6bdUPnIqZEA485Ux/pub?gid=0&single=true&output=csv';
  const response = await fetch(url);
  const data = await response.text();
  return {
    csvData: data,
  };
};
