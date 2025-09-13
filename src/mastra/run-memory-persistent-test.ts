import { mastraMemory } from './index.js';

async function main() {
  console.log('Writing persistent memory...');
  const entry = await (mastraMemory as any).write?.('demo', 'greeting', 'hello from persistent memory');
  console.log('Write entry:', entry);

  console.log('Reading persistent memory...');
  const all = await (mastraMemory as any).readAll?.('demo');
  console.log('Read entries:', all);
}

if (require.main === module) {
  main().then(() => console.log('Done')).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
