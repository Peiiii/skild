import assert from 'node:assert/strict';
import stringWidth from 'string-width';

let formatInteractiveRow;
try {
  ({ formatInteractiveRow } = await import('../dist/ui/interactive-tree-prompt.js'));
} catch {
  ({ formatInteractiveRow } = await import('../dist/interactive-tree-prompt.js'));
}

function visibleWidth(value) {
  return stringWidth(value);
}

function mustFit(label, rendered, maxWidth) {
  assert.ok(
    visibleWidth(rendered) <= maxWidth,
    `${label}: expected width <= ${maxWidth}, got ${visibleWidth(rendered)}\n${rendered}`
  );
  assert.ok(!rendered.includes('\n'), `${label}: should not contain newline`);
}

// Prefer truncating suffix/hint first, keep name intact when possible.
{
  const maxWidth = 60;
  const name = 'very-long-skill-name/with/deep/path/and-suffix';
  const suffixText = ' - ' + 'x'.repeat(200);
  const hintText = ' (Space: select all)';

  const rendered = formatInteractiveRow({
    cursorMark: '> ',
    indent: '  ',
    glyph: '○',
    name,
    count: '',
    suffixText,
    hintText,
    isCursor: true,
    maxWidth,
    styleName: s => s,
  });

  mustFit('suffix-truncation', rendered, maxWidth);
  assert.ok(rendered.includes(name), 'suffix-truncation: expected full name to remain');
  assert.ok(rendered.includes('…'), 'suffix-truncation: expected ellipsis for truncation');
}

// When width is very small, name should truncate in the middle (keep both ends).
{
  const maxWidth = 30;
  const name = 'prefix-KEEP-left----KEEP-right-suffix';
  const rendered = formatInteractiveRow({
    cursorMark: '> ',
    indent: '',
    glyph: '●',
    name,
    count: '',
    suffixText: '',
    hintText: '',
    isCursor: true,
    maxWidth,
    styleName: s => s,
  });

  mustFit('name-middle-truncation', rendered, maxWidth);
  assert.ok(rendered.includes('…'), 'name-middle-truncation: expected ellipsis');
  assert.ok(rendered.includes('prefix'), 'name-middle-truncation: expected left part preserved');
  assert.ok(rendered.includes('suffix'), 'name-middle-truncation: expected right part preserved');
}

process.stdout.write('interactive-tree-prompt selfcheck: OK\n');
