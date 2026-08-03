import { describe, expect, it } from 'vitest';
import { MockReaderAgent, runReaderAgent } from '../src/reader-agent.js';
import { createDocument, segmentDocument } from '../src/segmenter.js';

const content = 'Alpha is first.\n\nBeta is second.';
const document = createDocument(content, { id: 'doc-reader-run' });
const segments = segmentDocument(document);

function outputFor(segment: (typeof segments)[number]) {
  return {
    segmentId: segment.id,
    claims: [{
      claim: segment.text,
      claimType: 'empirical',
      speaker: null,
      stance: 'asserted',
      evidence: {
        documentId: document.id,
        segmentId: segment.id,
        text: segment.text,
        startOffset: segment.startOffset,
        endOffset: segment.endOffset,
      },
      confidence: 0.8,
      requiresExternalVerification: false,
    }],
  };
}

describe('runReaderAgent', () => {
  it('calls the reader exactly once for each isolated segment', async () => {
    const reader = new MockReaderAgent(({ segment }) => outputFor(segment));

    const result = await runReaderAgent(document, segments, reader);

    expect(reader.calls.map(call => call.segment.id)).toEqual(segments.map(segment => segment.id));
    expect(reader.calls.every(call => call.documentId === document.id)).toBe(true);
    expect(result.accepted).toHaveLength(2);
    expect(result.rejected).toEqual([]);
  });

  it('does not allow one segment response to claim evidence from another', async () => {
    const reader = new MockReaderAgent(({ segment }) => {
      if (segment.id === segments[0].id) {
        return outputFor(segments[1]);
      }
      return { segmentId: segment.id, claims: [] };
    });

    const result = await runReaderAgent(document, segments, reader);

    expect(result.accepted).toEqual([]);
    expect(result.outputErrors.map(error => error.code)).toContain('SEGMENT_MISMATCH');
  });

  it('records a reader failure and continues with later segments', async () => {
    const reader = new MockReaderAgent(({ segment }) => {
      if (segment.id === segments[0].id) {
        throw new Error('reader unavailable');
      }
      return outputFor(segment);
    });

    const result = await runReaderAgent(document, segments, reader);

    expect(result.executionErrors).toEqual([{
      segmentId: segments[0].id,
      message: 'reader unavailable',
    }]);
    expect(result.accepted).toHaveLength(1);
  });

  it('keeps a valid candidate when another candidate is malformed', async () => {
    const reader = new MockReaderAgent(({ segment }) => {
      const output = outputFor(segment);
      return { ...output, claims: [...output.claims, { confidence: 99 }] };
    });

    const result = await runReaderAgent(document, [segments[0]], reader);

    expect(result.accepted).toHaveLength(1);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].errors[0].code).toBe('SCHEMA_INVALID');
  });
});
