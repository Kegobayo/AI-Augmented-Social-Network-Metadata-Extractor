import type { ReactNode } from "react";

/** Render inline markdown (bold, italic) so model emphasis marks never show as literal asterisks. */
export function renderInline(text: string, prefix = ""): ReactNode[] {
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
  return boldParts.map((part, i) => {
    const key = `${prefix}b${i}`;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    const italicParts = part.split(/(\*[^*\s][^*]*\*)/g);
    return italicParts.map((seg, j) => {
      const k = `${key}-${j}`;
      if (seg.length > 2 && seg.startsWith("*") && seg.endsWith("*")) {
        return <em key={k}>{seg.slice(1, -1)}</em>;
      }
      return <span key={k}>{seg}</span>;
    });
  });
}
