const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Execute real processors, replacing registration to avoid Redis/model calls.
async function processorFor(file, className, operation) {
  let processor;
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, '../src/queue_workers', file + '.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(compiled, {
    exports, Error, console: { log() {}, error() {} },
    require(name) {
      assert.equal(name, './JobQueue');
      return { JobQueue: { async createQueue(_name, fn) { processor = fn; return {}; } } };
    },
  });
  await exports[className].createQueue(operation);
  return processor;
}

for (const [file, className, data] of [
  ['contentTranslationQueue', 'ContentTranslationQueue', { processedContentId: 'article', targetLanguage: 'english' }],
  ['contentProcessingQueue', 'ContentProcessingQueue', { articleId: 'article' }],
  ['contentCrawlingQueue', 'ContentCrawlingQueue', { url: 'https://example.com/article' }],
]) {
  test(`${className}: rejects service errors instead of completing`, async () => {
    const error = new Error('socket hang up');
    const processor = await processorFor(file, className, async () => { throw error; });
    const progress = [];
    await assert.rejects(processor(data, async p => progress.push(p)), e => e === error);
    assert.ok(!progress.includes(100));
  });
  test(`${className}: normalizes non-Error failures`, async () => {
    const processor = await processorFor(file, className, async () => { throw 'connection lost'; });
    await assert.rejects(processor(data, async () => {}), { message: 'connection lost' });
  });
  test(`${className}: rejects invalid input before calling service`, async () => {
    let called = false;
    const processor = await processorFor(file, className, async () => { called = true; });
    await assert.rejects(processor({}, async () => {}), /Invalid/);
    assert.equal(called, false);
  });
  test(`${className}: preserves successful and existing-content results`, async () => {
    for (const result of [{ _id: 'result' }, null]) {
      const processor = await processorFor(file, className, async () => result);
      const progress = [];
      const output = await processor(data, async p => progress.push(p));
      assert.equal(output.status, 'success');
      assert.equal(progress.at(-1), 100);
    }
  });
}
