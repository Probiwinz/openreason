import { createHash } from 'node:crypto';
import path from 'node:path';
import type { Document, DocumentFormat, Segment, SegmentKind } from './schema.js';

export type CreateDocumentOptions = {
  id?: string;
  format?: DocumentFormat;
  title?: string;
  sourcePath?: string;
};

type SourceLine = {
  start: number;
  contentEnd: number;
  text: string;
};

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}

function inferFormat(sourcePath?: string): DocumentFormat {
  if (!sourcePath) return 'plaintext';
  const extension = path.extname(sourcePath).toLowerCase();
  return extension === '.md' || extension === '.markdown' ? 'markdown' : 'plaintext';
}

export function createDocument(content: string, options: CreateDocumentOptions = {}): Document {
  const format = options.format ?? inferFormat(options.sourcePath);
  const id = options.id ?? `doc-${digest(`${format}\0${content}`)}`;

  return {
    id,
    content,
    format,
    ...(options.title ? { title: options.title } : {}),
    ...(options.sourcePath ? { sourcePath: options.sourcePath } : {}),
  };
}

function readLines(content: string): SourceLine[] {
  const lines: SourceLine[] = [];
  let start = 0;

  while (start < content.length) {
    const newline = content.indexOf('\n', start);
    const rawEnd = newline === -1 ? content.length : newline;
    const contentEnd = rawEnd > start && content[rawEnd - 1] === '\r' ? rawEnd - 1 : rawEnd;
    lines.push({
      start,
      contentEnd,
      text: content.slice(start, contentEnd),
    });
    start = newline === -1 ? content.length : newline + 1;
  }

  return lines;
}

function makeSegment(
  document: Document,
  segments: Segment[],
  kind: SegmentKind,
  headingPath: string[],
  startOffset: number,
  endOffset: number,
): void {
  const text = document.content.slice(startOffset, endOffset);
  const idSeed = `${document.id}\0${kind}\0${startOffset}\0${endOffset}\0${text}`;
  segments.push({
    id: `${document.id}:seg-${digest(idSeed)}`,
    documentId: document.id,
    index: segments.length,
    kind,
    headingPath: [...headingPath],
    text,
    startOffset,
    endOffset,
  });
}

export function segmentDocument(document: Document): Segment[] {
  const lines = readLines(document.content);
  const segments: Segment[] = [];
  let headingPath: string[] = [];
  let blockStart: number | undefined;
  let blockEnd: number | undefined;

  const flushParagraph = (): void => {
    if (blockStart === undefined || blockEnd === undefined) return;
    makeSegment(document, segments, 'paragraph', headingPath, blockStart, blockEnd);
    blockStart = undefined;
    blockEnd = undefined;
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];

    if (document.format === 'markdown') {
      const fenceStart = line.text.match(/^\s*(`{3,}|~{3,})/);
      if (fenceStart) {
        flushParagraph();
        const fenceCharacter = fenceStart[1][0];
        const minimumLength = fenceStart[1].length;
        const closingFence = new RegExp(`^\\s*${fenceCharacter}{${minimumLength},}\\s*$`);
        let codeEnd = line.contentEnd;

        for (let candidateIndex = lineIndex + 1; candidateIndex < lines.length; candidateIndex += 1) {
          const candidate = lines[candidateIndex];
          codeEnd = candidate.contentEnd;
          lineIndex = candidateIndex;
          if (closingFence.test(candidate.text)) break;
        }

        makeSegment(document, segments, 'code', headingPath, line.start, codeEnd);
        continue;
      }

      const heading = line.text.match(/^(#{1,6})[\t ]+(.+?)\s*$/);
      if (heading) {
        flushParagraph();
        const depth = heading[1].length;
        const title = heading[2].replace(/[\t ]+#+[\t ]*$/, '').trim();
        headingPath = [...headingPath.slice(0, depth - 1), title];
        makeSegment(document, segments, 'heading', headingPath, line.start, line.contentEnd);
        continue;
      }
    }

    if (line.text.trim().length === 0) {
      flushParagraph();
      continue;
    }

    blockStart ??= line.start;
    blockEnd = line.contentEnd;
  }

  flushParagraph();
  return segments;
}
