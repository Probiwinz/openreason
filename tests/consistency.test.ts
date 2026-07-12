import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { loadFrameworks } from '../src/loader.js';
import { loadPacks } from '../src/openreason/packs.js';

const FRAMEWORKS_ROOT = 'frameworks';
const PACKS_ROOT = 'packs';

describe('pack/framework consistency', () => {
  const frameworks = loadFrameworks(FRAMEWORKS_ROOT);
  const implementedIds = new Set(frameworks.map(f => f.id));
  const packs = loadPacks(PACKS_ROOT);

  it('draft pack entries have a corresponding framework YAML file', () => {
    const missing: string[] = [];
    for (const pack of packs) {
      for (const fw of pack.frameworks) {
        if (fw.maturity === 'draft' || fw.maturity === 'implemented') {
          if (!implementedIds.has(fw.id)) {
            missing.push(`pack "${pack.id}" lists "${fw.id}" as ${fw.maturity} but no framework YAML was found`);
          }
        }
      }
    }
    expect(missing, missing.join('\n')).toHaveLength(0);
  });

  it('planned pack entries do NOT have a framework YAML file', () => {
    const unexpected: string[] = [];
    for (const pack of packs) {
      for (const fw of pack.frameworks) {
        if (fw.maturity === 'planned') {
          if (implementedIds.has(fw.id)) {
            unexpected.push(
              `pack "${pack.id}" lists "${fw.id}" as planned, but a framework YAML exists — update maturity to "draft"`
            );
          }
        }
      }
    }
    expect(unexpected, unexpected.join('\n')).toHaveLength(0);
  });

  it('every framework YAML is referenced by at least one pack', () => {
    const referencedIds = new Set(packs.flatMap(p => p.frameworks.map(f => f.id)));
    const unreferenced = frameworks
      .filter(f => !referencedIds.has(f.id))
      .map(f => f.id);
    expect(
      unreferenced,
      `Framework(s) exist but are not referenced in any pack: ${unreferenced.join(', ')}`
    ).toHaveLength(0);
  });

  it('every framework has a companion .md file', () => {
    const missingMd: string[] = [];
    for (const f of frameworks) {
      // Find the YAML file path by walking frameworks/
      const yamlFiles: string[] = [];
      function walk(dir: string) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else if (entry.isFile() && entry.name.endsWith('.yaml')) yamlFiles.push(full);
        }
      }
      walk(FRAMEWORKS_ROOT);
      const yamlPath = yamlFiles.find(p => p.includes(f.id.replace(/^[^-]+-/, '') + '.yaml') ||
        p.includes(f.id + '.yaml'));
      if (yamlPath) {
        const mdPath = yamlPath.replace('.yaml', '.md');
        if (!fs.existsSync(mdPath)) {
          missingMd.push(`framework "${f.id}" has no companion .md file (expected: ${mdPath})`);
        }
      }
    }
    expect(missingMd, missingMd.join('\n')).toHaveLength(0);
  });

  it('every framework has a non-empty scope field', () => {
    for (const f of frameworks) {
      expect(
        f.scope.trim().length,
        `framework "${f.id}" has an empty scope field`
      ).toBeGreaterThan(0);
    }
  });

  it('every framework has at least one capability', () => {
    for (const f of frameworks) {
      expect(
        f.capabilities.length,
        `framework "${f.id}" has no capabilities listed`
      ).toBeGreaterThan(0);
    }
  });

  it('framework capabilities match capabilities registered in packs', () => {
    const packCapabilities = new Set(packs.flatMap(p => p.capabilities));
    const mismatches: string[] = [];
    for (const f of frameworks) {
      for (const cap of f.capabilities) {
        if (!packCapabilities.has(cap)) {
          mismatches.push(`framework "${f.id}" claims capability "${cap}" which is not registered in any pack`);
        }
      }
    }
    expect(mismatches, mismatches.join('\n')).toHaveLength(0);
  });

  it('every framework has at least one limitation', () => {
    for (const f of frameworks) {
      expect(
        f.limitations.length,
        `framework "${f.id}" has no limitations listed`
      ).toBeGreaterThan(0);
    }
  });

  it('every framework has at least one reference with a title', () => {
    for (const f of frameworks) {
      expect(
        f.references.length,
        `framework "${f.id}" has no references`
      ).toBeGreaterThan(0);
      for (const ref of f.references) {
        expect(
          ref.title.length,
          `framework "${f.id}" has a reference with an empty title`
        ).toBeGreaterThan(0);
      }
    }
  });

  it('every framework evidence_statuses list includes O1', () => {
    for (const f of frameworks) {
      expect(
        f.evidence_statuses,
        `framework "${f.id}" does not include O1 in evidence_statuses`
      ).toContain('O1');
    }
  });

  it('every framework evidence_statuses list includes H1', () => {
    for (const f of frameworks) {
      expect(
        f.evidence_statuses,
        `framework "${f.id}" does not include H1 in evidence_statuses`
      ).toContain('H1');
    }
  });

  it('every framework has at least one analysis_question', () => {
    for (const f of frameworks) {
      expect(
        f.analysis_questions.length,
        `framework "${f.id}" has no analysis_questions`
      ).toBeGreaterThan(0);
    }
  });

  it('every framework has at least one decision_rule', () => {
    for (const f of frameworks) {
      expect(
        f.decision_rules.length,
        `framework "${f.id}" has no decision_rules`
      ).toBeGreaterThan(0);
    }
  });
});
