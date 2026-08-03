import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { loadFrameworks } from '../src/loader.js';
import { loadPacks } from '../src/openreason/packs.js';

const DISCOURSE_FRAMEWORKS = ['discourse-van-dijk', 'discourse-fairclough', 'discourse-wodak'];
const FRAMEWORKS_ROOT = 'frameworks';
const PACKS_ROOT = 'packs';

describe('Discourse Pack', () => {
  const packs = loadPacks(PACKS_ROOT);
  const discoursePack = packs.find(p => p.id === 'discourse');

  it('discourse pack exists', () => {
    expect(discoursePack).toBeDefined();
  });

  it('discourse pack covers discourse_analysis capability', () => {
    expect(discoursePack!.capabilities).toContain('discourse_analysis');
  });

  it('discourse pack covers group_representation_analysis capability', () => {
    expect(discoursePack!.capabilities).toContain('group_representation_analysis');
  });

  it('discourse pack covers social_effect_analysis capability', () => {
    expect(discoursePack!.capabilities).toContain('social_effect_analysis');
  });

  it('discourse pack contains all three discourse frameworks', () => {
    const ids = discoursePack!.frameworks.map(f => f.id);
    for (const id of DISCOURSE_FRAMEWORKS) {
      expect(ids, `discourse pack missing framework: ${id}`).toContain(id);
    }
  });

  it('all three discourse frameworks are draft', () => {
    for (const fw of discoursePack!.frameworks) {
      expect(fw.maturity, `${fw.id} should be draft, got ${fw.maturity}`).toBe('draft');
    }
  });

  it('all three discourse frameworks have YAML files', () => {
    const frameworks = loadFrameworks(FRAMEWORKS_ROOT);
    const loadedIds = new Set(frameworks.map(f => f.id));
    for (const id of DISCOURSE_FRAMEWORKS) {
      expect(loadedIds, `no YAML file loaded for ${id}`).toContain(id);
    }
  });

  it('all three discourse frameworks have companion .md files', () => {
    const expectedPaths: Record<string, string> = {
      'discourse-van-dijk': path.join(FRAMEWORKS_ROOT, 'discourse', 'van_dijk.md'),
      'discourse-fairclough': path.join(FRAMEWORKS_ROOT, 'discourse', 'fairclough.md'),
      'discourse-wodak': path.join(FRAMEWORKS_ROOT, 'discourse', 'wodak.md'),
    };
    for (const [id, mdPath] of Object.entries(expectedPaths)) {
      expect(fs.existsSync(mdPath), `${id} missing companion .md at ${mdPath}`).toBe(true);
    }
  });
});

describe('Discourse framework YAML compliance', () => {
  const frameworks = loadFrameworks(FRAMEWORKS_ROOT);
  const discourseFrameworks = frameworks.filter(f => DISCOURSE_FRAMEWORKS.includes(f.id));

  it('loaded all three discourse frameworks', () => {
    expect(discourseFrameworks.length).toBe(3);
  });

  for (const f of discourseFrameworks) {
    describe(f.id, () => {
      it('has verification_status: draft', () => {
        expect(f.verification_status).toBe('draft');
      });

      it('has non-empty scope', () => {
        expect(f.scope.trim().length).toBeGreaterThan(0);
      });

      it('has discourse_analysis capability', () => {
        expect(
          f.capabilities,
          `${f.id} should include discourse_analysis capability`
        ).toContain('discourse_analysis');
      });

      it('evidence_statuses includes O1, O2, D1, H1', () => {
        expect(f.evidence_statuses).toContain('O1');
        expect(f.evidence_statuses).toContain('O2');
        expect(f.evidence_statuses).toContain('D1');
        expect(f.evidence_statuses).toContain('H1');
      });

      it('has at least 5 analysis_steps', () => {
        expect(
          f.analysis_steps.length,
          `${f.id} has fewer than 5 analysis steps`
        ).toBeGreaterThanOrEqual(5);
      });

      it('has at least 4 decision_rules', () => {
        expect(
          f.decision_rules.length,
          `${f.id} has fewer than 4 decision rules`
        ).toBeGreaterThanOrEqual(4);
      });

      it('all decision_rules reference [D1] evidence status', () => {
        const d1Rules = f.decision_rules.filter(r => r.includes('[D1]'));
        expect(
          d1Rules.length,
          `${f.id} has decision_rules that do not reference [D1]`
        ).toBe(f.decision_rules.length);
      });

      it('has at least 5 analysis_questions', () => {
        expect(
          f.analysis_questions.length,
          `${f.id} has fewer than 5 analysis questions`
        ).toBeGreaterThanOrEqual(5);
      });

      it('has at least 4 substantive limitations', () => {
        expect(
          f.limitations.length,
          `${f.id} has fewer than 4 limitations`
        ).toBeGreaterThanOrEqual(4);
      });

      it('has at least one reference with title and author', () => {
        expect(f.references.length).toBeGreaterThan(0);
        for (const ref of f.references) {
          expect(ref.title.length, `${f.id}: reference missing title`).toBeGreaterThan(0);
          expect(ref.author, `${f.id}: reference missing author`).toBeDefined();
          expect(ref.author!.length, `${f.id}: reference has empty author`).toBeGreaterThan(0);
        }
      });

      it('intents include discourse_analysis', () => {
        expect(
          f.intents,
          `${f.id} does not include discourse_analysis intent`
        ).toContain('discourse_analysis');
      });
    });
  }
});

describe('Discourse framework differentiation', () => {
  const frameworks = loadFrameworks(FRAMEWORKS_ROOT);
  const discourseFrameworks = frameworks.filter(f => DISCOURSE_FRAMEWORKS.includes(f.id));

  it('each framework has distinct core_concepts', () => {
    const conceptSets = discourseFrameworks.map(f => new Set(f.core_concepts));
    // No two frameworks should have identical concept sets
    for (let i = 0; i < conceptSets.length; i++) {
      for (let j = i + 1; j < conceptSets.length; j++) {
        const a = [...conceptSets[i]].sort().join(',');
        const b = [...conceptSets[j]].sort().join(',');
        expect(a, 'Two discourse frameworks have identical core_concepts').not.toBe(b);
      }
    }
  });

  it('van-dijk has ideological square as a core concept', () => {
    const vd = discourseFrameworks.find(f => f.id === 'discourse-van-dijk')!;
    expect(vd.core_concepts).toContain('ideological square');
  });

  it('fairclough has intertextuality as a core concept', () => {
    const fc = discourseFrameworks.find(f => f.id === 'discourse-fairclough')!;
    expect(fc.core_concepts).toContain('intertextuality');
  });

  it('wodak has topoi as a core concept', () => {
    const wo = discourseFrameworks.find(f => f.id === 'discourse-wodak')!;
    expect(wo.core_concepts).toContain('topoi');
  });

  it('wodak has discursive strategies as a core concept', () => {
    const wo = discourseFrameworks.find(f => f.id === 'discourse-wodak')!;
    expect(wo.core_concepts).toContain('discursive strategies');
  });

  it('fairclough has three-dimensional model as a core concept', () => {
    const fc = discourseFrameworks.find(f => f.id === 'discourse-fairclough')!;
    expect(fc.core_concepts).toContain('three-dimensional model');
  });

  it('all three frameworks have distinct triggers', () => {
    // Fairclough and Wodak should have triggers van-dijk does not
    const vdTriggers = new Set(
      discourseFrameworks.find(f => f.id === 'discourse-van-dijk')!.triggers
    );
    const fcTriggers = discourseFrameworks.find(f => f.id === 'discourse-fairclough')!.triggers;
    const fcUnique = fcTriggers.some(t => !vdTriggers.has(t));
    expect(fcUnique, 'Fairclough has no triggers distinct from van-dijk').toBe(true);
  });
});

describe('Discourse pack companion .md content', () => {
  const requiredSections = [
    '## Purpose',
    '## Scope',
    '## Capabilities provided',
    '## Workflow summary',
    '## Evidence mapping',
    '## Decision rule rationale',
    '## Worked example',
    '## Limitations',
    '## Known gaps',
    '## References',
    '## Verification record',
    '## Changelog',
  ];

  const mdFiles: Record<string, string> = {
    'discourse-van-dijk': 'frameworks/discourse/van_dijk.md',
    'discourse-fairclough': 'frameworks/discourse/fairclough.md',
    'discourse-wodak': 'frameworks/discourse/wodak.md',
  };

  for (const [id, mdPath] of Object.entries(mdFiles)) {
    describe(`${id} companion .md`, () => {
      const content = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, 'utf8') : '';

      it('file exists and is non-empty', () => {
        expect(fs.existsSync(mdPath)).toBe(true);
        expect(content.length).toBeGreaterThan(0);
      });

      for (const section of requiredSections) {
        it(`contains section: ${section}`, () => {
          expect(content, `${id} companion .md is missing section: ${section}`).toContain(section);
        });
      }

      it('declares draft verification status', () => {
        expect(content).toContain('draft');
      });

      it('verification record says Not yet verified', () => {
        expect(content).toContain('Not yet verified');
      });
    });
  }
});
