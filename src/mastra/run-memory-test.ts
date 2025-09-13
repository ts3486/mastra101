import { memoryTool } from './tools/memory-tool.js';

async function main() {
  console.log('Writing memory entry...');
  const writeRes: any = await (memoryTool.execute as any)({ input: { action: 'write', namespace: 'test', key: 'favorite_color', value: 'blue' } });
  console.log('Write result:', writeRes);

  console.log('Reading memory entries...');
  const readRes: any = await (memoryTool.execute as any)({ input: { action: 'readAll', namespace: 'test' } });
  console.log('Read result:', readRes);

  console.log('Clearing memory...');
  const clearRes: any = await (memoryTool.execute as any)({ input: { action: 'clear', namespace: 'test' } });
  console.log('Clear result:', clearRes);
}

if (require.main === module) {
  main().then(() => console.log('Done')).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
