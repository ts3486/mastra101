import('../dist/playground-memory-demo.js').then(mod => {
  // Module runs its top-level main when imported, but to be safe call exported function if present
  if (mod.runDemo) {
    mod.runDemo().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(2)});
  }
}).catch(e=>{ console.error(e); process.exit(1); });
