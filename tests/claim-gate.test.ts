import { describe, expect, it } from 'vitest';
import { gateReaderOutput } from '../src/claim-gate.js';
import { createDocument, segmentDocument } from '../src/segmenter.js';

const content = 'The city says ridership increased by twelve percent.\n\nDid the mayor approve the plan?';
const document = createDocument(content, { id: 'doc-reader-test' });
const segments = segmentDocument(document);

function candidate(overrides: Record<string, unknown> = {}) {
  const evidenceText = 'ridership increased by twelve percent';
  const startOffset = content.indexOf(evidenceText);

  return {
    claim: 'Ridership increased by twelve percent.',
    claimType: 'empirical',
    speaker: 'the city',
    stance: 'asserted',
    evidence: {
      documentId: document.id,
      segmentId: segments[0].id,
      text: evidenceText,
      startOffset,
      endOffset: startOffset + evidenceText.length,
    },
    confidence: 0.93,
    requiresExternalVerification: true,
    ...overrides,
  };
}

function errorCodes(result: ReturnType<typeof gateReaderOutput>): string[] {
  return result.rejected.flatMap(rejection => rejection.errors.map(error => error.code));
}

describe('gateReaderOutput', () => {
  it('accepts a grounded asserted claim', () => {
    const result = gateReaderOutput({ segmentId: segments[0].id, claims: [candidate()] }, document, segments[0]);

    expect(result.outputErrors).toEqual([]);
    expect(result.rejected).toEqual([]);
    expect(result.accepted).toHaveLength(1);
    expect(result.accepted[0]).toMatchObject({
      id: expect.stringMatching(/^doc-reader-test:claim-[a-f0-9]{12}$/),
      stance: 'asserted',
      speaker: 'the city',
    });
  });

  it('accepts a questioned claim with its speaker', () => {
    const evidenceText = 'Did the mayor approve the plan?';
    const startOffset = content.indexOf(evidenceText);
    const questioned = candidate({
      claim: 'The mayor approved the plan.',
      speaker: 'narrator',
      stance: 'questioned',
      evidence: {
        documentId: document.id,
        segmentId: segments[1].id,
        text: evidenceText,
        startOffset,
        endOffset: startOffset + evidenceText.length,
      },
    });

    const result = gateReaderOutput({ segmentId: segments[1].id, claims: [questioned] }, document, segments[1]);

    expect(result.rejected).toEqual([]);
    expect(result.accepted[0]).toMatchObject({ stance: 'questioned', speaker: 'narrator' });
  });

  it('rejects hallucinated evidence text', () => {
    const bad = candidate();
    bad.evidence.text = 'ridership doubled overnight';

    const result = gateReaderOutput({ segmentId: segments[0].id, claims: [bad] }, document, segments[0]);

    expect(errorCodes(result)).toContain('EVIDENCE_TEXT_MISMATCH');
    expect(result.accepted).toEqual([]);
  });

  it('rejects evidence that names a different segment', () => {
    const bad = candidate();
    bad.evidence.segmentId = 'missing-segment';

    const result = gateReaderOutput({ segmentId: segments[0].id, claims: [bad] }, document, segments[0]);

    expect(errorCodes(result)).toContain('SEGMENT_MISMATCH');
  });

  it('rejects evidence offsets outside the segment and document', () => {
    const bad = candidate();
    bad.evidence.endOffset = content.length + 10;

    const result = gateReaderOutput({ segmentId: segments[0].id, claims: [bad] }, document, segments[0]);

    expect(errorCodes(result)).toEqual(expect.arrayContaining([
      'EVIDENCE_OUT_OF_SEGMENT_BOUNDS',
      'EVIDENCE_OUT_OF_DOCUMENT_BOUNDS',
    ]));
  });

  it.each([
    ['unknown claim type', { claimType: 'historical-opinion' }, ['claimType']],
    ['unknown stance', { stance: 'probably' }, ['stance']],
    ['confidence above one', { confidence: 1.1 }, ['confidence']],
  ])('rejects malformed schema data: %s', (_label, overrides, expectedPath) => {
    const result = gateReaderOutput({ segmentId: segments[0].id, claims: [candidate(overrides)] }, document, segments[0]);

    expect(errorCodes(result)).toContain('SCHEMA_INVALID');
    expect(result.rejected[0].errors.some(error =>
      JSON.stringify(error.path) === JSON.stringify(expectedPath),
    )).toBe(true);
  });

  it('keeps valid claims when another claim is malformed', () => {
    const result = gateReaderOutput({
      segmentId: segments[0].id,
      claims: [candidate(), candidate({ confidence: -1 })],
    }, document, segments[0]);

    expect(result.accepted).toHaveLength(1);
    expect(result.rejected).toHaveLength(1);
  });

  it('creates deterministic IDs and rejects an exact duplicate', () => {
    const first = gateReaderOutput({ segmentId: segments[0].id, claims: [candidate()] }, document, segments[0]);
    const second = gateReaderOutput({ segmentId: segments[0].id, claims: [candidate()] }, document, segments[0]);
    const duplicate = gateReaderOutput({ segmentId: segments[0].id, claims: [candidate(), candidate()] }, document, segments[0]);

    expect(first.accepted[0].id).toBe(second.accepted[0].id);
    expect(duplicate.accepted).toHaveLength(1);
    expect(errorCodes(duplicate)).toContain('DUPLICATE_CLAIM');
  });

  it('rejects a malformed reader envelope without treating it as a claim', () => {
    const result = gateReaderOutput({ items: [candidate()] }, document, segments[0]);

    expect(result.accepted).toEqual([]);
    expect(result.rejected).toEqual([]);
    expect(result.outputErrors[0].code).toBe('INVALID_READER_OUTPUT');
  });

  it('rejects an output envelope for a different segment', () => {
    const result = gateReaderOutput({
      segmentId: segments[1].id,
      claims: [candidate()],
    }, document, segments[0]);

    expect(result.accepted).toEqual([]);
    expect(result.outputErrors[0].code).toBe('SEGMENT_MISMATCH');
  });

  it('uses end-exclusive JavaScript offsets for Unicode evidence', () => {
    const unicodeContent = 'Start 🚲 café\r\nEnd';
    const unicodeDocument = createDocument(unicodeContent, { id: 'doc-unicode' });
    const [unicodeSegment] = segmentDocument(unicodeDocument);
    const evidenceText = '🚲 café';
    const startOffset = unicodeContent.indexOf(evidenceText);
    const result = gateReaderOutput({
      segmentId: unicodeSegment.id,
      claims: [{
        claim: 'The text mentions a bicycle and a café.',
        claimType: 'interpretive',
        speaker: null,
        stance: 'asserted',
        evidence: {
          documentId: unicodeDocument.id,
          segmentId: unicodeSegment.id,
          text: evidenceText,
          startOffset,
          endOffset: startOffset + evidenceText.length,
        },
        confidence: 1,
        requiresExternalVerification: false,
      }],
    }, unicodeDocument, unicodeSegment);

    expect(result.accepted).toHaveLength(1);
    expect(result.rejected).toEqual([]);
  });
});
