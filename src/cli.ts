#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { validateFrameworks, loadFrameworks } from './loader.js';
import { detectIntent } from './router.js';
import { resolveFrameworks } from './resolver.js';
import { compileInstructions } from './compiler.js';
import { createAnalysisPacket, writeAnalysisPacket } from './engine.js';
import { ReasoningEngine } from './openreason/index.js';
import { createDocument, segmentDocument } from './segmenter.js';
import { CodexSubagentReaderAgent } from './codex-subagent-reader.js';
import { CodexSubagentClaimVerifierAgent } from './codex-subagent-claim-verifier.js';
import { ReaderAbortError, runReaderAgent } from './reader-agent.js';
import { ClaimVerifierAbortError, runClaimVerifier } from './claim-verifier.js';
import type { DocumentFormat } from './schema.js';

const program = new Command();
program.name('openreason').description('Transparent reasoning framework reference implementation').version('0.1.0');

program.command('validate').description('Validate all framework YAML files').action(() => {
  const ids = validateFrameworks();
  console.log(`Validated ${ids.length} framework(s): ${ids.join(', ')}`);
});

program.command('run')
  .argument('<input>', 'input markdown/text file')
  .option('--out <dir>', 'output directory', 'reports')
  .description('Run OpenReason analysis on an input file using ReasoningEngine')
  .action((inputPath, options) => {
    const engine = new ReasoningEngine();
    const result = engine.analyzeFile(inputPath);
    const basename = path.basename(inputPath, path.extname(inputPath));
    const outDir = path.join(options.out, basename);
    fs.mkdirSync(outDir, { recursive: true });

    const scaffoldPath = path.join(outDir, 'scaffold.md');
    const planPath = path.join(outDir, 'plan.json');

    fs.writeFileSync(scaffoldPath, result.reportScaffold, 'utf8');
    fs.writeFileSync(planPath, JSON.stringify({
      intent: result.plan.intent,
      frameworks: result.plan.frameworks.map(f => ({
        id: f.id,
        name: f.name,
        verification_status: f.verification_status,
        evidence_statuses: f.evidence_statuses,
      })),
      evidenceModel: result.plan.evidenceModel,
    }, null, 2), 'utf8');

    console.log(`\nOpenReason analysis ready:`);
    console.log(`  scaffold : ${scaffoldPath}`);
    console.log(`  plan     : ${planPath}`);
    console.log(`\nIntent    : ${result.plan.intent.primaryIntent} (${result.plan.intent.confidence} confidence)`);
    console.log(`Frameworks: ${result.plan.frameworks.map(f => f.id).join(', ')}`);
    console.log(`\nNext step : Read ${scaffoldPath} and complete the [FILL: ...] sections.`);
  });

program.command('inspect').argument('<input>', 'input markdown/text file').description('Detect intent and selected frameworks').action((inputPath) => {
  const input = fs.readFileSync(inputPath, 'utf8');
  const intent = detectIntent(input);
  const frameworks = loadFrameworks();
  const resolution = resolveFrameworks(intent, frameworks, input);
  console.log(JSON.stringify({ intent, frameworks: resolution.activatedFrameworks.map((f) => f.id) }, null, 2));
});

program.command('segment')
  .argument('<input>', 'input markdown/text file')
  .option('--format <format>', 'input format: plaintext or markdown')
  .option('--out <file>', 'write JSON to a file instead of stdout')
  .description('Deterministically split a plain-text or Markdown document into traceable segments')
  .action((inputPath, options: { format?: string; out?: string }) => {
    if (options.format && options.format !== 'plaintext' && options.format !== 'markdown') {
      throw new Error(`Unsupported format "${options.format}". Use plaintext or markdown.`);
    }

    const content = fs.readFileSync(inputPath, 'utf8');
    const document = createDocument(content, {
      sourcePath: inputPath,
      format: options.format as DocumentFormat | undefined,
    });
    const output = JSON.stringify({ document, segments: segmentDocument(document) }, null, 2);

    if (options.out) {
      fs.mkdirSync(path.dirname(options.out), { recursive: true });
      fs.writeFileSync(options.out, output, 'utf8');
      console.log(`Wrote ${options.out}`);
      return;
    }

    console.log(output);
  });

program.command('read')
  .argument('<input>', 'input markdown/text file')
  .option('--format <format>', 'input format: plaintext or markdown')
  .option('--out <file>', 'write the complete reader result to a JSON file')
  .option('--codex-bin <path>', 'Codex executable (or set OPENREASON_CODEX_BIN)')
  .option('--model <id>', 'optional Codex model override')
  .option('--timeout-ms <milliseconds>', 'timeout per reader or verifier call', '120000')
  .option('--verify', 'semantically verify every gated reader claim')
  .description('Extract gated claims with Codex and optionally verify their semantic faithfulness')
  .action(async (inputPath, options: {
    format?: string;
    out?: string;
    codexBin?: string;
    model?: string;
    timeoutMs: string;
    verify?: boolean;
  }) => {
    if (options.format && options.format !== 'plaintext' && options.format !== 'markdown') {
      throw new Error(`Unsupported format "${options.format}". Use plaintext or markdown.`);
    }

    const timeoutMs = Number(options.timeoutMs);
    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
      throw new Error('--timeout-ms must be a positive integer.');
    }

    const content = fs.readFileSync(inputPath, 'utf8');
    const document = createDocument(content, {
      sourcePath: inputPath,
      format: options.format as DocumentFormat | undefined,
    });
    const segments = segmentDocument(document);
    const controller = new AbortController();
    const abort = (): void => controller.abort();
    process.once('SIGINT', abort);

    try {
      const reader = new CodexSubagentReaderAgent({
        cwd: process.cwd(),
        codexExecutable: options.codexBin,
        model: options.model,
        timeoutMs,
        signal: controller.signal,
      });
      const result = await runReaderAgent(document, segments, reader);

      const verification = options.verify
        ? await runClaimVerifier(
          result.accepted,
          segments,
          new CodexSubagentClaimVerifierAgent({
            cwd: process.cwd(),
            codexExecutable: options.codexBin,
            model: options.model,
            timeoutMs,
            signal: controller.signal,
          }),
        )
        : undefined;

      const output = JSON.stringify({
        document,
        segments,
        result,
        ...(verification ? { verification } : {}),
      }, null, 2);

      if (options.out) {
        fs.mkdirSync(path.dirname(options.out), { recursive: true });
        fs.writeFileSync(options.out, output, 'utf8');
        console.log(`Wrote ${options.out}`);
      } else {
        console.log(output);
      }

      if (
        result.executionErrors.length > 0
        || result.outputErrors.length > 0
        || (verification && (
          verification.executionErrors.length > 0
          || verification.outputErrors.length > 0
        ))
      ) {
        process.exitCode = 2;
      }
    } catch (error) {
      if (error instanceof ReaderAbortError || error instanceof ClaimVerifierAbortError) {
        console.error('OpenReason reader/verifier cancelled.');
        process.exitCode = 130;
        return;
      }
      throw error;
    } finally {
      process.removeListener('SIGINT', abort);
    }
  });

program.command('compile').argument('<input>', 'input markdown/text file').option('--out <file>', 'output file', 'compiled_prompt.md').description('Compile selected frameworks into OpenReason instructions').action((inputPath, options) => {
  const input = fs.readFileSync(inputPath, 'utf8');
  const intent = detectIntent(input);
  const frameworks = loadFrameworks();
  const resolution = resolveFrameworks(intent, frameworks, input);
  const compiled = compileInstructions(input, intent, resolution.activatedFrameworks);
  fs.writeFileSync(options.out, compiled, 'utf8');
  console.log(`Wrote ${options.out}`);
});

program.command('analyze').argument('<input>', 'input markdown/text file').option('--out <file>', 'output report', 'reports/report.md').description('Create an OpenReason analysis packet/report scaffold').action((inputPath, options) => {
  const packet = createAnalysisPacket(inputPath);
  writeAnalysisPacket(packet, options.out);
  console.log(`Wrote ${options.out}`);
});

program.command('init-report-dir').description('Create reports directory').action(() => {
  fs.mkdirSync(path.resolve('reports'), { recursive: true });
  console.log('Created reports/');
});

await program.parseAsync(process.argv);
