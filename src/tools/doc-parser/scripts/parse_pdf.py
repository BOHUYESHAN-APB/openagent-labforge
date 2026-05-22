#!/usr/bin/env python3
"""
Standardized PDF parser — extracts text with preserved paragraph/sentence boundaries.

Output: structured JSON with pages, paragraphs, sentences, and full_text.

This script is pre-written to be stable across all LLM invocations.
Models that cannot natively read PDFs should call this script instead.
"""
import json
import sys
import argparse
from pathlib import Path


def extract_text_blocks(pdf_path: str) -> dict:
    """
    Extract text blocks from PDF using PyMuPDF.
    Preserves reading order, paragraph boundaries, and page structure.
    """
    import fitz  # PyMuPDF

    doc = fitz.open(pdf_path)
    result = {
        "filename": Path(pdf_path).name,
        "total_pages": len(doc),
        "pages": [],
    }

    for page_num, page in enumerate(doc, 1):
        # Get text blocks in reading order
        blocks = page.get_text("dict")["blocks"]
        paragraphs = []
        full_text_parts = []

        for block in blocks:
            if block["type"] != 0:  # Skip non-text blocks (images, etc.)
                continue

            # Extract text from all lines in this block
            text_parts = []
            for line in block["lines"]:
                line_text = "".join(span["text"] for span in line["spans"])
                text_parts.append(line_text)

            text = "".join(text_parts)

            # Skip empty or whitespace-only blocks
            if not text.strip():
                continue

            # Merge hyphenated words across line breaks
            text = text.replace("-\n", "")

            paragraphs.append({
                "index": len(paragraphs),
                "text": text.strip(),
                "bbox": list(block["bbox"]),
            })
            full_text_parts.append(text.strip())

        # Split paragraphs into sentences (Chinese + English)
        sentences = []
        for para in paragraphs:
            para_sentences = _split_sentences(para["text"])
            for s_idx, sent in enumerate(para_sentences):
                if sent.strip():
                    sentences.append({
                        "index": len(sentences),
                        "text": sent.strip(),
                        "paragraph_index": para["index"],
                    })

        result["pages"].append({
            "page_num": page_num,
            "width": page.rect.width,
            "height": page.rect.height,
            "paragraphs": paragraphs,
            "sentences": sentences,
            "full_text": "\n".join(full_text_parts),
        })

    # Full document text
    result["full_text"] = "\n".join(
        p["full_text"] for p in result["pages"]
    )

    doc.close()
    return result


def _split_sentences(text: str) -> list[str]:
    """
    Split text into sentences handling both Chinese and English punctuation.
    Preserves the sentence-ending punctuation with the sentence.
    """
    import re

    # Sentence boundary patterns: Chinese/English endings
    # Requires the character BEFORE the boundary to be non-whitespace
    pattern = (
        r'(?<=[。！？!?])\s*'           # Standard sentence endings
        r'|(?<=[；;])\s*'               # Semicolons as weak boundaries
        r'|(?<=[.])\s+(?=[A-Z"（(])'   # English period + capital letter
    )

    sentences = re.split(pattern, text.replace("\n", " "))
    return [s.strip() for s in sentences if len(s.strip()) > 5]


def extract_text_only(pdf_path: str) -> str:
    """Quick text extraction without full structure."""
    import fitz

    doc = fitz.open(pdf_path)
    text = []
    for page in doc:
        text.append(page.get_text())
    doc.close()
    return "\n".join(text)


def main():
    parser = argparse.ArgumentParser(
        description="Extract structured text from PDF"
    )
    parser.add_argument("pdf", help="Path to PDF file")
    parser.add_argument("--json", action="store_true",
                       help="Output structured JSON")
    parser.add_argument("--text-only", action="store_true",
                       help="Output plain text only")
    parser.add_argument("-o", "--output",
                       help="Output file path (default: stdout)")
    args = parser.parse_args()

    if not Path(args.pdf).exists():
        print(f"Error: file not found: {args.pdf}", file=sys.stderr)
        sys.exit(1)

    try:
        if args.text_only:
            result = extract_text_only(args.pdf)
        else:
            result = extract_text_blocks(args.pdf)

        output = json.dumps(
            result, ensure_ascii=False, indent=2
        ) if not args.text_only else result

        if args.output:
            Path(args.output).write_text(output, encoding="utf-8")
            print(f"Written to: {args.output}", file=sys.stderr)
        else:
            print(output)

    except ImportError as e:
        print(f"Error: missing dependency. Install PyMuPDF: pip install PyMuPDF\n{e}",
              file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error parsing PDF: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
