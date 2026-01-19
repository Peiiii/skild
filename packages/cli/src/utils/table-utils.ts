import chalk from 'chalk';

export interface TableColumn {
    header: string;
    width: number;
    align?: 'left' | 'center' | 'right';
}

export interface TableRow {
    cells: string[];
    style?: 'normal' | 'header' | 'separator';
}

export interface TableOptions {
    columns: TableColumn[];
    rows: TableRow[];
    borderStyle?: 'single' | 'double' | 'rounded';
}

// Unicode box-drawing characters
const BOX_CHARS = {
    single: {
        topLeft: '┌',
        topRight: '┐',
        bottomLeft: '└',
        bottomRight: '┘',
        horizontal: '─',
        vertical: '│',
        cross: '┼',
        teeDown: '┬',
        teeUp: '┴',
        teeRight: '├',
        teeLeft: '┤',
    },
    double: {
        topLeft: '╔',
        topRight: '╗',
        bottomLeft: '╚',
        bottomRight: '╝',
        horizontal: '═',
        vertical: '║',
        cross: '╬',
        teeDown: '╦',
        teeUp: '╩',
        teeRight: '╠',
        teeLeft: '╣',
    },
    rounded: {
        topLeft: '╭',
        topRight: '╮',
        bottomLeft: '╰',
        bottomRight: '╯',
        horizontal: '─',
        vertical: '│',
        cross: '┼',
        teeDown: '┬',
        teeUp: '┴',
        teeRight: '├',
        teeLeft: '┤',
    },
};

/**
 * Get the visible length of a string (excluding ANSI color codes)
 */
function visibleLength(str: string): number {
    // Remove ANSI escape codes
    return str.replace(/\u001b\[\d+m/g, '').length;
}

/**
 * Pad a string to a specific width, accounting for ANSI color codes
 */
function padString(str: string, width: number, align: 'left' | 'center' | 'right' = 'left'): string {
    const visible = visibleLength(str);
    const padding = Math.max(0, width - visible);

    if (align === 'center') {
        const leftPad = Math.floor(padding / 2);
        const rightPad = padding - leftPad;
        return ' '.repeat(leftPad) + str + ' '.repeat(rightPad);
    } else if (align === 'right') {
        return ' '.repeat(padding) + str;
    } else {
        return str + ' '.repeat(padding);
    }
}

/**
 * Truncate a string to fit within a width, adding ellipsis if needed
 */
function truncateString(str: string, maxWidth: number): string {
    const visible = visibleLength(str);
    if (visible <= maxWidth) return str;

    // For colored strings, we need to be more careful
    // Simple approach: remove color codes, truncate, then we lose colors
    // Better approach would be to preserve colors, but that's complex
    const plain = str.replace(/\u001b\[\d+m/g, '');
    return plain.slice(0, maxWidth - 1) + '…';
}

/**
 * Render a horizontal border line
 */
function renderBorder(
    columns: TableColumn[],
    chars: typeof BOX_CHARS.single,
    type: 'top' | 'middle' | 'bottom'
): string {
    const left = type === 'top' ? chars.topLeft : type === 'bottom' ? chars.bottomLeft : chars.teeRight;
    const right = type === 'top' ? chars.topRight : type === 'bottom' ? chars.bottomRight : chars.teeLeft;
    const junction = type === 'top' ? chars.teeDown : type === 'bottom' ? chars.teeUp : chars.cross;

    const segments = columns.map(col => chars.horizontal.repeat(col.width + 2));
    return left + segments.join(junction) + right;
}

/**
 * Render a table row
 */
function renderRow(cells: string[], columns: TableColumn[], chars: typeof BOX_CHARS.single): string {
    const paddedCells = cells.map((cell, i) => {
        const col = columns[i];
        if (!col) return '';
        const truncated = truncateString(cell, col.width);
        return ' ' + padString(truncated, col.width, col.align || 'left') + ' ';
    });

    return chars.vertical + paddedCells.join(chars.vertical) + chars.vertical;
}

/**
 * Render a complete table
 */
export function renderTable(options: TableOptions): string {
    const { columns, rows, borderStyle = 'rounded' } = options;
    const chars = BOX_CHARS[borderStyle];
    const lines: string[] = [];

    // Top border
    lines.push(renderBorder(columns, chars, 'top'));

    // Header row
    const headerCells = columns.map(col => chalk.bold(col.header));
    lines.push(renderRow(headerCells, columns, chars));

    // Separator after header
    lines.push(renderBorder(columns, chars, 'middle'));

    // Data rows
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;

        if (row.style === 'separator') {
            lines.push(renderBorder(columns, chars, 'middle'));
        } else if (row.style === 'header') {
            // Section header row (like "📦 SKILLSETS")
            const cells = row.cells.map(cell => chalk.bold(cell));
            lines.push(renderRow(cells, columns, chars));
        } else {
            lines.push(renderRow(row.cells, columns, chars));
        }
    }

    // Bottom border
    lines.push(renderBorder(columns, chars, 'bottom'));

    return lines.join('\n');
}

/**
 * Calculate optimal column widths based on content
 */
export function calculateColumnWidths(
    headers: string[],
    rows: string[][],
    minWidth: number = 8,
    maxWidth: number = 40
): number[] {
    const widths = headers.map((header, i) => {
        const headerLen = visibleLength(header);
        const maxContentLen = Math.max(
            ...rows.map(row => visibleLength(row[i] || ''))
        );
        return Math.max(minWidth, Math.min(maxWidth, Math.max(headerLen, maxContentLen)));
    });

    return widths;
}

/**
 * Create a simple table builder for fluent API
 */
export class TableBuilder {
    private columns: TableColumn[] = [];
    private rows: TableRow[] = [];
    private borderStyle: 'single' | 'double' | 'rounded' = 'rounded';

    addColumn(header: string, width: number, align?: 'left' | 'center' | 'right'): this {
        this.columns.push({ header, width, align });
        return this;
    }

    addRow(cells: string[], style?: 'normal' | 'header' | 'separator'): this {
        this.rows.push({ cells, style });
        return this;
    }

    addSeparator(): this {
        this.rows.push({ cells: [], style: 'separator' });
        return this;
    }

    addHeaderRow(cells: string[]): this {
        this.rows.push({ cells, style: 'header' });
        return this;
    }

    setBorderStyle(style: 'single' | 'double' | 'rounded'): this {
        this.borderStyle = style;
        return this;
    }

    render(): string {
        return renderTable({
            columns: this.columns,
            rows: this.rows,
            borderStyle: this.borderStyle,
        });
    }
}
