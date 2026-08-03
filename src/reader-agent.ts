import type { Claim } from './claim-schema.js';
import {
  gateReaderOutput,
  type ClaimGateError,
  type ClaimGateResult,
  type RejectedClaim,
} from './claim-gate.js';
import type { Document, Segment } from './schema.js';

export type ReaderRequest = {
  documentId: string;
  segment: Segment;
};

/** A provider-neutral reader. Its return value stays untrusted until gated. */
export interface ReaderAgent {
  readonly id: string;
  readSegment(request: ReaderRequest): Promise<unknown>;
}

/** Signals an intentional user/system cancellation rather than a bad segment. */
export class ReaderAbortError extends Error {
  override readonly name = 'ReaderAbortError';
}

export type ReaderExecutionError = {
  segmentId: string;
  message: string;
};

export type ReaderSegmentResult = {
  segmentId: string;
  gate?: ClaimGateResult;
  executionError?: ReaderExecutionError;
};

export type ReaderRunResult = {
  readerId: string;
  documentId: string;
  segmentResults: ReaderSegmentResult[];
  accepted: Claim[];
  rejected: RejectedClaim[];
  outputErrors: ClaimGateError[];
  executionErrors: ReaderExecutionError[];
};

export type MockReaderHandler = (
  request: ReaderRequest,
) => unknown | Promise<unknown>;

/** Deterministic test reader; no model, network, API key, or provider required. */
export class MockReaderAgent implements ReaderAgent {
  readonly calls: ReaderRequest[] = [];

  constructor(
    private readonly handler: MockReaderHandler,
    readonly id = 'mock-reader',
  ) {}

  async readSegment(request: ReaderRequest): Promise<unknown> {
    this.calls.push(request);
    return this.handler(request);
  }
}

function executionMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Runs one isolated reader call per segment, then gates every untrusted output.
 * A failed segment is recorded without preventing later segments from running.
 */
export async function runReaderAgent(
  document: Document,
  segments: readonly Segment[],
  reader: ReaderAgent,
): Promise<ReaderRunResult> {
  const result: ReaderRunResult = {
    readerId: reader.id,
    documentId: document.id,
    segmentResults: [],
    accepted: [],
    rejected: [],
    outputErrors: [],
    executionErrors: [],
  };

  for (const segment of segments) {
    try {
      const output = await reader.readSegment({ documentId: document.id, segment });
      const gate = gateReaderOutput(output, document, segment);
      result.segmentResults.push({ segmentId: segment.id, gate });
      result.accepted.push(...gate.accepted);
      result.rejected.push(...gate.rejected);
      result.outputErrors.push(...gate.outputErrors);
    } catch (error) {
      if (error instanceof ReaderAbortError) throw error;
      const executionError = {
        segmentId: segment.id,
        message: executionMessage(error),
      };
      result.segmentResults.push({ segmentId: segment.id, executionError });
      result.executionErrors.push(executionError);
    }
  }

  return result;
}
