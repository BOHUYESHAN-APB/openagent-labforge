/**
 * doc-parser — Standardized PDF/DOCX document parsing tool.
 *
 * Provides a unified interface to the Python parsing scripts.
 * The scripts themselves are pre-written by high-quality models to ensure
 * stable output regardless of which LLM invokes them.
 *
 * Pipeline:
 *   doc-parser  →  Python script (PyMuPDF)  →  structured JSON
 *
 * Usage (from other tools/agents):
 *   import { parsePdf, parseDocx } from '../doc-parser';
 *   const result = await parsePdf('paper.pdf');
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crossSpawn } from '../../utils/compat.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = join(__dirname, 'scripts');

export type ParsedPage = {
  page_num: number;
  paragraphs: Array<{
    index: number;
    text: string;
    bbox?: [number, number, number, number];
  }>;
  full_text: string;
};

export type ParseResult = {
  filename: string;
  total_pages?: number;
  pages: ParsedPage[];
  full_text: string;
  error?: string;
};

function runPython(script: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const { proc, stdout, stderr, exited } = crossSpawn([
      'python',
      join(SCRIPTS_DIR, script),
      ...args,
    ]);
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error('Python script timed out after 30s'));
    }, 30_000);
    exited
      .then((code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve(stdout());
        } else {
          stderr().then((err) => reject(new Error(err || `exit code ${code}`)));
        }
      })
      .catch(reject);
  });
}

/**
 * Parse a PDF file using the Python script.
 * Falls back gracefully if Python/PyMuPDF is not available.
 */
export async function parsePdf(path: string): Promise<ParseResult> {
  try {
    const stdout = await runPython('parse_pdf.py', [path, '--json']);
    return JSON.parse(stdout) as ParseResult;
  } catch (err) {
    return {
      filename: path,
      pages: [],
      full_text: '',
      error: `Python parser error: ${err instanceof Error ? err.message : String(err)}. Install: pip install PyMuPDF`,
    };
  }
}

/**
 * Parse a DOCX file using the Python script.
 */
export async function parseDocx(path: string): Promise<{
  filename: string;
  paragraphs: Array<{ index: number; text: string; style?: string }>;
  full_text: string;
  error?: string;
}> {
  try {
    const stdout = await runPython('parse_docx.py', [path, '--json']);
    return JSON.parse(stdout);
  } catch (err) {
    return {
      filename: path,
      paragraphs: [],
      full_text: '',
      error: `Python parser error: ${err instanceof Error ? err.message : String(err)}. Install: pip install python-docx`,
    };
  }
}
