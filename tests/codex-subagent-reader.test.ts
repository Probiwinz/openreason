import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildCodexEnvironment,
  CodexSubagentReaderAgent,
  resolveCodexReaderOutput,
  type CodexCommandInvocation,
} from '../src/codex-subagent-reader.js';
import { runReaderAgent } from '../src/reader-agent.js';
import { createDocument, segmentDocument } from '../src/segmenter.js';

const cwd = '/tmp/openreason-codex-reader-test';
const schemaPath = path.join(
  cwd,
  '.codex/schemas/openreason-reader-output.schema.json',
);

function quotedOutput(segmentId: string, evidenceText = 'ridership increased') {
  return {
    segmentId,
    claims: [{
      claim: 'Ridership increased.',
      claimType: 'empirical',
      speaker: 'the city',
      stance: 'asserted',
      evidenceText,
      confidence: 0.9,
      requiresExternalVerification: true,
    }],
  };
}

function verifiedCodexJsonl(output: unknown): string {
  return [
    JSON.stringify({ type: 'thread.started', thread_id: 'thread-test' }),
    JSON.stringify({
      type: 'item.completed',
      item: { type: 'collab_tool_call', tool: 'spawn_agent', status: 'completed' },
    }),
    JSON.stringify({
      type: 'item.completed',
      item: { type: 'agent_message', text: JSON.stringify(output) },
    }),
    JSON.stringify({ type: 'turn.completed' }),
  ].join('\n');
}

describe('CodexSubagentReaderAgent', () => {
  it('runs one read-only Codex delegation and grounds its quote', async () => {
    const document = createDocument(
      'Intro.\n\nThe city says ridership increased this year.',
      { id: 'doc-codex-reader' },
    );
    const segments = segmentDocument(document);
    const segment = segments[1];
    const invocations: CodexCommandInvocation[] = [];
    const reader = new CodexSubagentReaderAgent({
      cwd,
      codexExecutable: '/opt/codex',
      timeoutMs: 42_000,
      runner: async invocation => {
        invocations.push(invocation);
        return {
          exitCode: 0,
          stdout: verifiedCodexJsonl(quotedOutput(segment.id)),
          stderr: '',
        };
      },
    });

    const result = await runReaderAgent(document, [segment], reader);

    expect(invocations).toHaveLength(1);
    expect(invocations[0]).toMatchObject({
      command: '/opt/codex',
      cwd,
      timeoutMs: 42_000,
      args: [
        '-a',
        'never',
        '--enable',
        'multi_agent',
        '-c',
        'web_search="disabled"',
        '-c',
        'allow_login_shell=false',
        '-c',
        'shell_environment_policy.inherit="none"',
        'exec',
        '--strict-config',
        '--sandbox',
        'read-only',
        '--output-schema',
        schemaPath,
        '--color',
        'never',
        '--json',
        '-C',
        cwd,
        '-',
      ],
    });
    expect(invocations[0].stdin).toContain(
      'your first tool call must be `spawn_agent` for the project custom agent named `openreason_reader`, with `fork_turns="none"`.',
    );
    expect(invocations[0].stdin).toContain('Do not spawn any other agent.');
    expect(JSON.parse(invocations[0].stdin.slice(invocations[0].stdin.lastIndexOf('\n') + 1))).toEqual({
      documentId: document.id,
      segmentId: segment.id,
      segmentText: segment.text,
    });
    expect(result.executionErrors).toEqual([]);
    expect(result.rejected).toEqual([]);
    expect(result.accepted[0].evidence).toEqual({
      documentId: document.id,
      segmentId: segment.id,
      text: 'ridership increased',
      startOffset: document.content.indexOf('ridership increased'),
      endOffset: document.content.indexOf('ridership increased') + 'ridership increased'.length,
    });
  });

  it('leaves repeated evidence impossible so the hard gate rejects ambiguity', async () => {
    const document = createDocument('same then same', { id: 'doc-repeat' });
    const [segment] = segmentDocument(document);
    const request = { documentId: document.id, segment };

    const output = resolveCodexReaderOutput(quotedOutput(segment.id, 'same'), request);
    const reader = new CodexSubagentReaderAgent({
      cwd,
      runner: async () => ({
        exitCode: 0,
        stdout: verifiedCodexJsonl(quotedOutput(segment.id, 'same')),
        stderr: '',
      }),
    });
    const result = await runReaderAgent(document, [segment], reader);

    expect(output).toMatchObject({
      claims: [{
        evidence: {
          startOffset: segment.endOffset,
          endOffset: segment.endOffset + 4,
        },
      }],
    });
    expect(result.accepted).toEqual([]);
    expect(result.rejected[0].errors.map(error => error.code)).toContain(
      'EVIDENCE_OUT_OF_SEGMENT_BOUNDS',
    );
  });

  it('does not pass API keys into the Codex process environment', () => {
    const environment = buildCodexEnvironment({
      HOME: '/Users/test',
      PATH: '/usr/bin',
      CODEX_API_KEY: 'secret-codex-key',
      OPENAI_API_KEY: 'secret-openai-key',
      OPENROUTER_API_KEY: 'secret-openrouter-key',
    });

    expect(environment).toEqual({ HOME: '/Users/test', PATH: '/usr/bin' });
  });

  it('lets the hard gate reject an invented evidence quote', async () => {
    const document = createDocument('The city reported growth.', { id: 'doc-hallucination' });
    const [segment] = segmentDocument(document);
    const reader = new CodexSubagentReaderAgent({
      cwd,
      runner: async () => ({
        exitCode: 0,
        stdout: verifiedCodexJsonl(quotedOutput(segment.id, 'growth doubled overnight')),
        stderr: '',
      }),
    });

    const result = await runReaderAgent(document, [segment], reader);

    expect(result.accepted).toEqual([]);
    expect(result.rejected[0].errors.map(error => error.code)).toContain(
      'EVIDENCE_OUT_OF_SEGMENT_BOUNDS',
    );
  });

  it('surfaces Codex process and JSON failures as isolated execution errors', async () => {
    const document = createDocument('A claim.', { id: 'doc-errors' });
    const [segment] = segmentDocument(document);
    const failingReader = new CodexSubagentReaderAgent({
      cwd,
      runner: async () => ({ exitCode: 7, stdout: '', stderr: 'not logged in' }),
    });
    const invalidJsonReader = new CodexSubagentReaderAgent({
      cwd,
      runner: async () => ({ exitCode: 0, stdout: 'not json', stderr: '' }),
    });

    const failed = await runReaderAgent(document, [segment], failingReader);
    const invalid = await runReaderAgent(document, [segment], invalidJsonReader);

    expect(failed.executionErrors[0].message).toBe(
      'Codex reader exited with status 7: not logged in',
    );
    expect(invalid.executionErrors[0].message).toBe(
      'Codex reader returned invalid JSON.',
    );
  });

  it('rejects a valid-looking parent answer when no subagent was spawned', async () => {
    const document = createDocument('A claim.', { id: 'doc-no-subagent' });
    const [segment] = segmentDocument(document);
    const reader = new CodexSubagentReaderAgent({
      cwd,
      runner: async () => ({
        exitCode: 0,
        stdout: [
          JSON.stringify({ type: 'thread.started', thread_id: 'thread-no-subagent' }),
          JSON.stringify({
            type: 'item.completed',
            item: {
              type: 'agent_message',
              text: JSON.stringify(quotedOutput(segment.id, 'A claim.')),
            },
          }),
        ].join('\n'),
        stderr: '',
      }),
      subagentVerifier: async () => false,
    });

    const result = await runReaderAgent(document, [segment], reader);

    expect(result.accepted).toEqual([]);
    expect(result.executionErrors[0].message).toBe(
      'Codex reader did not spawn the required openreason_reader subagent.',
    );
  });
});
