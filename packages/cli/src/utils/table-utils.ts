/**
 * Terminal Table Utility
 *
 * A robust, general-purpose table rendering utility for CLI applications.
 * Uses string-width for accurate Unicode character width calculation,
 * ensuring perfect alignment with emoji, CJK characters, and other wide characters.
 */

import stringWidth from 'string-width';
import chalk from 'chalk';

// ============================================================================
// Types
// ============================================================================

export type TextAlign = 'left' | 'center' | 'right';

export interface TableColumn {
    /** Column header text */
    header: string;
    /** Fixed column width (in terminal columns) */
    width: number;
    /** Text alignment within the cell */
    align?: TextAlign;
}

export interface TableRow {
    /** Cell contents for this row */
    cells: string[];
    /** Row style: normal, section header, or separator line */
    style?: 'normal' | 'section' | 'separator';
}

export interface TableConfig {
    /** Column definitions */
    columns: TableColumn[];
    /** Data rows */
    rows: TableRow[];
    /** Border style: rounded, single, or double */
    border?: 'rounded' | 'single' | 'double';
    /** Padding on each side of cell content */
    cellPadding?: number;
}

// ============================================================================
// Box Drawing Characters
// ============================================================================

const BORDERS = {
    rounded: {
        topLeft: '╭', topRight: '╮', bottomLeft: '╰', bottomRight: '╯',
        horizontal: '─', vertical: '│',
        teeDown: '┬', teeUp: '┴', teeRight: '├', teeLeft: '┤', cross: '┼',
    },
    single: {
        topLeft: '┌', topRight: '┐', bottomLeft: '└', bottomRight: '┘',
        horizontal: '─', vertical: '│',
        teeDown: '┬', teeUp: '┴', teeRight: '├', teeLeft: '┤', cross: '┼',
    },
    double: {
        topLeft: '╔', topRight: '╗', bottomLeft: '╚', bottomRight: '╝',
        horizontal: '═', vertical: '║',
        teeDown: '╦', teeUp: '╩', teeRight: '╠', teeLeft: '╣', cross: '╬',
    },
} as const;

type BorderChars = typeof BORDERS[keyof typeof BORDERS];

// ============================================================================
// String Utilities
// ============================================================================

/**
 * Get the visible width of a string in terminal columns.
 * Correctly handles ANSI escape codes, emoji, and wide characters.
 */
function getWidth(str: string): number {
    return stringWidth(str);
}

/**
 * Pad a string to a target width with proper Unicode handling.
 */
function pad(str: string, targetWidth: number, align: TextAlign = 'left'): string {
    const currentWidth = getWidth(str);
    const padding = Math.max(0, targetWidth - currentWidth);

    if (padding === 0) return str;

    if (align === 'center') {
        const left = Math.floor(padding / 2);
        const right = padding - left;
        return ' '.repeat(left) + str + ' '.repeat(right);
    }

    if (align === 'right') {
        return ' '.repeat(padding) + str;
    }

    // left align
    return str + ' '.repeat(padding);
}

/**
 * Truncate a string to fit within a target width, adding ellipsis if needed.
 * Preserves ANSI escape codes as much as possible.
 */
function truncate(str: string, maxWidth: number): string {
    if (getWidth(str) <= maxWidth) return str;

    // Remove ANSI codes for truncation, then we lose styling (simplified approach)
    const plain = str.replace(/\u001b\[[0-9;]*m/g, '');
    let result = '';
    let width = 0;

    for (const char of plain) {
        const charWidth = stringWidth(char);
        if (width + charWidth + 1 > maxWidth) break; // +1 for ellipsis
        result += char;
        width += charWidth;
    }

    return result + '…';
}

// ============================================================================
// Table Rendering
// ============================================================================

/**
 * Render a horizontal border line.
 */
function renderBorder(
    columns: TableColumn[],
    chars: BorderChars,
    position: 'top' | 'middle' | 'bottom',
    cellPadding: number
): string {
    const left = position === 'top' ? chars.topLeft
        : position === 'bottom' ? chars.bottomLeft
            : chars.teeRight;

    const right = position === 'top' ? chars.topRight
        : position === 'bottom' ? chars.bottomRight
            : chars.teeLeft;

    const junction = position === 'top' ? chars.teeDown
        : position === 'bottom' ? chars.teeUp
            : chars.cross;

    const segments = columns.map(col =>
        chars.horizontal.repeat(col.width + cellPadding * 2)
    );

    return left + segments.join(junction) + right;
}

/**
 * Render a single data row.
 */
function renderRow(
    cells: string[],
    columns: TableColumn[],
    chars: BorderChars,
    cellPadding: number
): string {
    const paddingStr = ' '.repeat(cellPadding);

    const formattedCells = columns.map((col, i) => {
        const content = cells[i] ?? '';
        const truncated = getWidth(content) > col.width
            ? truncate(content, col.width)
            : content;
        const padded = pad(truncated, col.width, col.align);
        return paddingStr + padded + paddingStr;
    });

    return chars.vertical + formattedCells.join(chars.vertical) + chars.vertical;
}

/**
 * Render a complete table from configuration.
 */
export function renderTable(config: TableConfig): string {
    const { columns, rows, border = 'rounded', cellPadding = 1 } = config;
    const chars = BORDERS[border];
    const lines: string[] = [];

    // Top border
    lines.push(renderBorder(columns, chars, 'top', cellPadding));

    // Header row
    const headerCells = columns.map(col => chalk.bold(col.header));
    lines.push(renderRow(headerCells, columns, chars, cellPadding));

    // Separator after header
    lines.push(renderBorder(columns, chars, 'middle', cellPadding));

    // Data rows
    for (const row of rows) {
        if (row.style === 'separator') {
            lines.push(renderBorder(columns, chars, 'middle', cellPadding));
        } else if (row.style === 'section') {
            // Section header with bold styling
            const sectionCells = row.cells.map((cell, i) =>
                i === 0 ? chalk.bold(cell) : cell
            );
            lines.push(renderRow(sectionCells, columns, chars, cellPadding));
        } else {
            lines.push(renderRow(row.cells, columns, chars, cellPadding));
        }
    }

    // Bottom border
    lines.push(renderBorder(columns, chars, 'bottom', cellPadding));

    return lines.join('\n');
}

// ============================================================================
// Table Builder (Fluent API)
// ============================================================================

/**
 * Fluent builder for constructing tables.
 *
 * @example
 * ```ts
 * const output = new Table()
 *     .column('Name', 20)
 *     .column('Status', 10, 'center')
 *     .section('Users')
 *     .row(['Alice', '✓'])
 *     .row(['Bob', '✓'])
 *     .separator()
 *     .section('Guests')
 *     .row(['Charlie', '—'])
 *     .render();
 * ```
 */
export class Table {
    private columns: TableColumn[] = [];
    private rows: TableRow[] = [];
    private borderStyle: 'rounded' | 'single' | 'double' = 'rounded';
    private padding = 1;

    /** Add a column definition. */
    column(header: string, width: number, align: TextAlign = 'left'): this {
        this.columns.push({ header, width, align });
        return this;
    }

    /** Add a normal data row. */
    row(cells: string[]): this {
        this.rows.push({ cells, style: 'normal' });
        return this;
    }

    /** Add a section header row (first cell is emphasized). */
    section(title: string, ...rest: string[]): this {
        const cells = [title, ...rest];
        // Fill remaining columns with empty strings
        while (cells.length < this.columns.length) {
            cells.push('');
        }
        this.rows.push({ cells, style: 'section' });
        return this;
    }

    /** Add a horizontal separator line. */
    separator(): this {
        this.rows.push({ cells: [], style: 'separator' });
        return this;
    }

    /** Set border style. */
    border(style: 'rounded' | 'single' | 'double'): this {
        this.borderStyle = style;
        return this;
    }

    /** Set cell padding. */
    cellPadding(padding: number): this {
        this.padding = padding;
        return this;
    }

    /** Render the table to a string. */
    render(): string {
        return renderTable({
            columns: this.columns,
            rows: this.rows,
            border: this.borderStyle,
            cellPadding: this.padding,
        });
    }
}

// ============================================================================
// Legacy API (for backward compatibility)
// ============================================================================

/** @deprecated Use Table class instead */
export class TableBuilder extends Table { }

/** @deprecated Use Table.column() instead */
export function calculateColumnWidths(
    headers: string[],
    rows: string[][],
    minWidth = 8,
    maxWidth = 40
): number[] {
    return headers.map((header, i) => {
        const headerLen = getWidth(header);
        const maxContentLen = Math.max(
            ...rows.map(row => getWidth(row[i] ?? ''))
        );
        return Math.max(minWidth, Math.min(maxWidth, Math.max(headerLen, maxContentLen)));
    });
}
