import { describe, expect, it } from 'vitest';
import { createDocument, segmentDocument } from '../src/openreason/index.js';

describe('createDocument', () => {
  it('infers Markdown from the source path and creates stable document IDs', () => {
    const first = createDocument('# Title\n', { sourcePath: 'notes.md' });
    const second = createDocument('# Title\n', { sourcePath: 'renamed.md' });

    expect(first.format).toBe('markdown');
    expect(first.id).toBe(second.id);
  });

  it('changes the generated ID when the content changes', () => {
    const first = createDocument('First version');
    const second = createDocument('Second version');

    expect(first.id).not.toBe(second.id);
  });
});

describe('segmentDocument', () => {
  it('splits plain text at blank lines and preserves exact source offsets', () => {
    const content = 'First paragraph\ncontinues here.\n\nSecond paragraph.\n';
    const document = createDocument(content, { format: 'plaintext' });
    const segments = segmentDocument(document);

    expect(segments.map(segment => segment.text)).toEqual([
      'First paragraph\ncontinues here.',
      'Second paragraph.',
    ]);
    expect(segments.map(segment => segment.kind)).toEqual(['paragraph', 'paragraph']);

    for (const segment of segments) {
      expect(content.slice(segment.startOffset, segment.endOffset)).toBe(segment.text);
      expect(segment.documentId).toBe(document.id);
    }
  });

  it('recognises Markdown headings and carries their path into following segments', () => {
    const content = '# Introduction\nOpening paragraph.\n\n## Details\nDetailed paragraph.';
    const document = createDocument(content, { format: 'markdown' });
    const segments = segmentDocument(document);

    expect(segments.map(segment => segment.kind)).toEqual([
      'heading',
      'paragraph',
      'heading',
      'paragraph',
    ]);
    expect(segments[0].headingPath).toEqual(['Introduction']);
    expect(segments[1].headingPath).toEqual(['Introduction']);
    expect(segments[2].headingPath).toEqual(['Introduction', 'Details']);
    expect(segments[3].headingPath).toEqual(['Introduction', 'Details']);
  });

  it('keeps fenced Markdown code together as one segment', () => {
    const content = '# Example\n\n```ts\nconst value = 1;\n```\n\nAfter code.';
    const document = createDocument(content, { format: 'markdown' });
    const segments = segmentDocument(document);
    const code = segments.find(segment => segment.kind === 'code');

    expect(code?.text).toBe('```ts\nconst value = 1;\n```');
    expect(code?.headingPath).toEqual(['Example']);
  });

  it('does not create empty heading-path entries when levels are skipped', () => {
    const document = createDocument('### Deep heading\nContent.', { format: 'markdown' });
    const segments = segmentDocument(document);

    expect(segments[0].headingPath).toEqual(['Deep heading']);
    expect(segments[1].headingPath).toEqual(['Deep heading']);
  });

  it('treats Markdown syntax as ordinary paragraph text in plaintext mode', () => {
    const document = createDocument('# Not a heading\nStill the same paragraph.', { format: 'plaintext' });
    const segments = segmentDocument(document);

    expect(segments).toHaveLength(1);
    expect(segments[0].kind).toBe('paragraph');
  });

  it('returns identical segment IDs for identical input', () => {
    const document = createDocument('# Stable\n\nOne.\n\nTwo.', { format: 'markdown' });
    const firstRun = segmentDocument(document);
    const secondRun = segmentDocument(document);

    expect(firstRun.map(segment => segment.id)).toEqual(secondRun.map(segment => segment.id));
    expect(new Set(firstRun.map(segment => segment.id)).size).toBe(firstRun.length);
  });

  it('handles CRLF offsets and empty documents', () => {
    const content = 'First.\r\n\r\nSecond.';
    const document = createDocument(content, { format: 'plaintext' });
    const segments = segmentDocument(document);

    expect(segments.map(segment => segment.text)).toEqual(['First.', 'Second.']);
    expect(segments.every(segment => content.slice(segment.startOffset, segment.endOffset) === segment.text)).toBe(true);
    expect(segmentDocument(createDocument(''))).toEqual([]);
  });
});
