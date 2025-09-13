import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const transactionsTool = createTool({
  id: 'get-transactions',
  description: 'Fetch transactions from a public Google Sheet (CSV export). Accepts a sheet URL or sheetId+gid.',
  inputSchema: z.object({
    sheetUrl: z.string().optional(),
    sheetId: z.string().optional(),
  gid: z.string().optional(),
  // If true (default), append a cache-busting query param to the export URL to avoid
  // stale cached CSV responses from Google or intermediate proxies. Set to false to
  // disable cache-busting.
  cacheBust: z.boolean().optional(),
  }),
  outputSchema: z.object({
    transactions: z.array(z.record(z.string())),
  }),
  execute: async ({ context }) => {
    const { sheetUrl, sheetId, gid } = context as any;
    let id = sheetId;
    let g = gid;

    if (!id && sheetUrl) {
      // try to extract /d/{id}/
      const m = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (m) id = m[1];
      const gm = sheetUrl.match(/[?&]gid=(\d+)/);
      if (gm) g = gm[1];
    }

    if (!id) throw new Error('sheetId or sheetUrl with sheet id is required');

    // public CSV export URL
    let exportUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv${g ? `&gid=${g}` : ''}`;
    const shouldBust = (context as any).cacheBust !== false;
    if (shouldBust) {
      exportUrl += `${exportUrl.includes('?') ? '&' : '?'}_cb=${Date.now()}`;
    }

    // Use no-cache headers to reduce the chance of stale responses from proxies.
    const res = await fetch(exportUrl, { headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' } });
    if (!res.ok) {
      throw new Error(`Failed to fetch sheet: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();

    // Normalize a common bad-export case: each CSV row was wrapped in an outer pair
    // of quotes (happens when the CSV was pasted into a single cell). Example line:
    // "2025-08-01,12.50,USD,..."
    // In that case parseCSV will treat the whole line as a single quoted field. Detect
    // and unwrap each line, converting doubled quotes back to single quotes, then re-join.
    const lines = text.split(/\r?\n/).filter(Boolean);
    let normalizedText = text;
    const looksWrapped = lines.length > 0 && lines.every((ln) => {
      const t = ln.trim();
      return t.startsWith('"') && t.endsWith('"');
    });
    if (looksWrapped) {
      const unwrapped = lines.map((ln) => {
        let t = ln.trim();
        // remove leading and trailing quote
        t = t.slice(1, -1);
        // un-escape doubled quotes
        t = t.replace(/""/g, '"');
        return t;
      });
      normalizedText = unwrapped.join('\n');
    }

    const rows = parseCSV(normalizedText);
    // Convert to array of records using header row
    if (rows.length === 0) return { transactions: [] };
    let headers = rows[0];

    // If the first row looks like data (e.g., starts with a YYYY-MM-DD date) then
    // the sheet likely omitted headers. Synthesize default headers for typical
    // transaction CSVs: Date,Amount,Currency,Merchant,Description,Category,Account,Type,TxnId
    const firstCell = (headers[0] || '').toString();
    const looksLikeDate = /^\d{4}-\d{2}-\d{2}$/.test(firstCell);
    const defaultHeaders = ['Date', 'Amount', 'Currency', 'Merchant', 'Description', 'Category', 'Account', 'Type', 'TxnId'];
    if (looksLikeDate) {
      headers = defaultHeaders;
      // Warn the user (logs) that headers were synthesized because the sheet appears
      // to have omitted a header row. This helps users notice and fix their sheet.
      // Use console.warn so it shows up in playground/dev server logs.
      try {
        console.warn('transactions-tool: No header row detected. Synthesized default headers.');
      } catch (e) {
        /* ignore logging failures in constrained runtimes */
      }
      // Prepend a fake header row to align column mapping: treat existing rows as data
      // (rows already contains data rows starting at index 0)
    }
    const records: Record<string, string>[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const obj: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j] ?? `col_${j}`] = row[j] ?? '';
      }
      records.push(obj);
    }
    return { transactions: records };
  },
});

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let curField = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { curField += '"'; i++; } else { inQuotes = false; }
      } else {
        curField += ch;
      }
    } else {
      if (ch === ',') { cur.push(curField); curField = ''; }
      else if (ch === '\"') { inQuotes = true; }
      else if (ch === '\r') { /* ignore */ }
      else if (ch === '\n') { cur.push(curField); rows.push(cur); cur = []; curField = ''; }
      else { curField += ch; }
    }
  }
  // push last
  if (inQuotes) {
    // malformed but push what we have
    cur.push(curField);
    rows.push(cur);
  } else if (curField !== '' || cur.length > 0) {
    cur.push(curField);
    rows.push(cur);
  }
  return rows;
}
