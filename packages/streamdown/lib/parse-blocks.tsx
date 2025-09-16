import { Lexer } from "marked";

export const parseMarkdownIntoBlocks = (markdown: string): string[] => {
  const tokens = Lexer.lex(markdown, { gfm: true });
  const blocks = tokens.map((token) => token.raw);

  // Post-process to merge consecutive blocks that are part of the same math block
  const mergedBlocks: string[] = [];

  for (const currentBlock of blocks) {
    // Check if this is a standalone $$ that might be a closing delimiter
    if (currentBlock.trim() === "$$" && mergedBlocks.length > 0) {
      const previousBlock = mergedBlocks.at(-1);

      if (!previousBlock) {
        continue;
      }

      // Check if the previous block starts with $$ but doesn't end with $$
      const prevStartsWith$$ = previousBlock.trimStart().startsWith("$$");
      const prevDollarCount = (previousBlock.match(/\$\$/g) || []).length;

      // If previous block has odd number of $$ and starts with $$, merge them
      if (prevStartsWith$$ && prevDollarCount % 2 === 1) {
        mergedBlocks[mergedBlocks.length - 1] = previousBlock + currentBlock;
        continue;
      }
    }

    // Check if current block ends with $$ and previous block started with $$ but didn't close
    if (mergedBlocks.length > 0 && currentBlock.trimEnd().endsWith("$$")) {
      const previousBlock = mergedBlocks.at(-1);

      if (!previousBlock) {
        continue;
      }

      const prevStartsWith$$ = previousBlock.trimStart().startsWith("$$");
      const prevDollarCount = (previousBlock.match(/\$\$/g) || []).length;
      const currDollarCount = (currentBlock.match(/\$\$/g) || []).length;

      // If previous block has unclosed math (odd $$) and current block ends with $$
      // AND current block doesn't start with $$, it's likely a continuation
      if (
        prevStartsWith$$ &&
        prevDollarCount % 2 === 1 &&
        !currentBlock.trimStart().startsWith("$$") &&
        currDollarCount === 1
      ) {
        mergedBlocks[mergedBlocks.length - 1] = previousBlock + currentBlock;
        continue;
      }
    }

    mergedBlocks.push(currentBlock);
  }

  // Additional post-process: keep custom HTML tags like <think>/<summary> together across blocks
  // This prevents unintended closure or splitting when a newline arrives mid-tag content
  const mergeBlocksByTags = (
    inputBlocks: string[],
    tagNames: string[]
  ): string[] => {
    const result: string[] = [];
    let buffer = "";
    const balance: Record<string, number> = {};
    for (const name of tagNames) balance[name] = 0;

    const hasOpen = (): boolean => tagNames.some((n) => balance[n] > 0);

    const updateBalance = (text: string): void => {
      for (const name of tagNames) {
        const openRe = new RegExp(`<\\s*${name}\\b[^>]*>`, "gi");
        const closeRe = new RegExp(`<\\/\\s*${name}\\s*>`, "gi");
        const opens = (text.match(openRe) || []).length;
        const closes = (text.match(closeRe) || []).length;
        balance[name] += opens - closes;
      }
    };

    for (const block of inputBlocks) {
      if (!hasOpen()) {
        buffer = block;
        updateBalance(block);
        if (!hasOpen()) {
          result.push(buffer);
          buffer = "";
        }
      } else {
        buffer += block;
        updateBalance(block);
        if (!hasOpen()) {
          result.push(buffer);
          buffer = "";
        }
      }
    }

    if (buffer) result.push(buffer);
    return result;
  };

  const finalBlocks = mergeBlocksByTags(mergedBlocks, ["think", "summary"]);
  return finalBlocks;
};
