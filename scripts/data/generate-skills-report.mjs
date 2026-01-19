#!/usr/bin/env node
/**
 * Generate a Markdown report from harvested skills data.
 *
 * Input:
 *   - data/skills-harvest.json (from harvest-skills.mjs)
 *   - data/skills/* (from materialize-skills.mjs) for SKILL.md/error status
 *
 * Output:
 *   - data/skills-report.md
 *
 * Usage:
 *   node scripts/data/generate-skills-report.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const harvestPath = path.join(root, 'data', 'skills-harvest.json');
const skillsDir = path.join(root, 'data', 'skills');
const outPath = path.join(root, 'data', 'skills-report.md');

function slugify(input) {
  return input
    .replace(/[^\w./-]+/g, '_')
    .replace(/[\\/]/g, '__')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function escapeMd(value) {
  if (value == null) return '';
  return String(value).replace(/\|/g, '\\|');
}

function loadHarvest() {
  const raw = fs.readFileSync(harvestPath, 'utf8');
  return JSON.parse(raw);
}

function readMaterializeStatus() {
  const status = new Map();
  if (!fs.existsSync(skillsDir)) return status;
  for (const entry of fs.readdirSync(skillsDir)) {
    const dir = path.join(skillsDir, entry);
    const hasSkill = fs.existsSync(path.join(dir, 'SKILL.md'));
    const errorPath = path.join(dir, 'error.txt');
    const error = fs.existsSync(errorPath) ? fs.readFileSync(errorPath, 'utf8').trim() : null;
    status.set(entry, { hasSkill, error });
  }
  return status;
}

function buildReport() {
  const harvest = loadHarvest();
  const items = harvest.items || [];
  const status = readMaterializeStatus();

  const summary = {
    total: items.length,
    registrySkills: items.filter((i) => i.source === 'registry' && !i.skillset).length,
    registrySkillsets: items.filter((i) => i.source === 'registry' && i.skillset).length,
    githubSkills: items.filter((i) => i.source === 'github').length,
  };

  let withSkillMd = 0;
  const errors = [];

  const rows = items.map((item, idx) => {
    const slug = slugify(item.name || item.install || item.sourceRepo || `item-${idx}`);
    const materialize = status.get(slug);
    if (materialize?.hasSkill) withSkillMd += 1;
    if (materialize?.error) errors.push({ slug, error: materialize.error });

    return {
      index: idx + 1,
      source: item.source,
      type: item.skillset ? 'skillset' : 'skill',
      name: item.name || '',
      install: item.install || '',
      stars: item.starsTotal ?? '',
      downloads7d: item.downloads7d ?? '',
      updatedAt: item.updatedAt || '',
      slug,
      hasSkill: materialize?.hasSkill || false,
    };
  });

  const lines = [];
  lines.push(`# Skills Harvest Report`);
  lines.push('');
  lines.push(`Generated at: ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`- Total items: ${summary.total}`);
  lines.push(`- Registry skills: ${summary.registrySkills}`);
  lines.push(`- Registry skillsets: ${summary.registrySkillsets}`);
  lines.push(`- GitHub skills: ${summary.githubSkills}`);
  lines.push(`- With SKILL.md fetched: ${withSkillMd}`);
  lines.push(`- Errors while fetching SKILL.md: ${errors.length}`);
  lines.push('');

  if (errors.length) {
    lines.push('## Errors');
    for (const err of errors) {
      lines.push(`- \`${err.slug}\`: ${err.error}`);
    }
    lines.push('');
  }

  lines.push('## Items');
  lines.push('| # | source | type | name | install | stars | downloads_7d | updatedAt | has_SKILL.md |');
  lines.push('| - | - | - | - | - | - | - | - | - |');
  for (const row of rows) {
    lines.push(
      `| ${row.index} | ${escapeMd(row.source)} | ${row.type} | \`${escapeMd(row.name)}\` | \`${escapeMd(row.install)}\` | ${row.stars} | ${row.downloads7d} | ${escapeMd(row.updatedAt)} | ${row.hasSkill ? '✅' : '❌'} |`,
    );
  }

  return lines.join('\n');
}

function main() {
  const report = buildReport();
  fs.writeFileSync(outPath, report, 'utf8');
  console.log(`[report] written to ${outPath}`);
}

main();
