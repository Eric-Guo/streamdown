import { Lexer } from "marked";

export const parseMarkdownIntoBlocks = (markdown: string): string[] => {
  const tokens = Lexer.lex(markdown, { gfm: true });

  // Single-pass: merge math blocks, keep custom tags together, and replace <think> with <summary>
  const tagNames = ["think"];

  const replaceThinkWithSummary = (html: string): string => {
    const openTag = /<\s*think\b([^>]*)>/gi;
    const closeTag = /<\s*\/\s*think\s*>/gi;
    return html.replace(openTag, "<summary$1>").replace(closeTag, "</summary>");
  };

  const updateBalance = (text: string, balance: Record<string, number>): void => {
    for (const name of tagNames) {
      const openRe = new RegExp(`<\\s*${name}\\b[^>]*>`, "gi");
      const closeRe = new RegExp(`<\\/\\s*${name}\\s*>`, "gi");
      const opens = (text.match(openRe) || []).length;
      const closes = (text.match(closeRe) || []).length;
      balance[name] += opens - closes;
    }
  };

  const hasOpen = (balance: Record<string, number>): boolean => {
    for (const name of tagNames) {
      if (balance[name] > 0) return true;
    }
    return false;
  };

  const shouldStartMathAccum = (text: string): boolean => {
    const startsWith$$ = text.trimStart().startsWith("$$");
    const count = (text.match(/\$\$/g) || []).length;
    return startsWith$$ && count % 2 === 1;
  };

  const shouldCloseMathAccum = (text: string): boolean => {
    const trimmed = text.trim();
    if (trimmed === "$$") return true;
    const startsWith$$ = text.trimStart().startsWith("$$");
    const endsWith$$ = text.trimEnd().endsWith("$$");
    const count = (text.match(/\$\$/g) || []).length;
    return endsWith$$ && !startsWith$$ && count === 1;
  };

  const result: string[] = [];
  let buffer = "";
  let mathOpen = false;
  const balance: Record<string, number> = {};
  for (const name of tagNames) balance[name] = 0;

  for (const token of tokens) {
    const raw = token.raw;

    if (mathOpen || hasOpen(balance)) {
      buffer += raw;
      updateBalance(raw, balance);
      if (mathOpen && shouldCloseMathAccum(raw)) {
        mathOpen = false;
      }
      if (!mathOpen && !hasOpen(balance)) {
        result.push(replaceThinkWithSummary(buffer));
        buffer = "";
      }
      continue;
    }

    if (shouldStartMathAccum(raw)) {
      buffer = raw;
      mathOpen = true;
      updateBalance(raw, balance);
      continue;
    }

    buffer = raw;
    updateBalance(raw, balance);
    if (hasOpen(balance)) {
      continue;
    }

    result.push(replaceThinkWithSummary(buffer));
    buffer = "";
  }

  if (buffer) {
    result.push(replaceThinkWithSummary(buffer));
  }

  return result;
};
