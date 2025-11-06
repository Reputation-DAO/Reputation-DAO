import type { ContentBlock } from '../lib/blog.types';

const WORDS_PER_MINUTE = 200;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function wordsInBlock(block: ContentBlock): number {
  switch (block.kind) {
    case 'Paragraph':
      return countWords(block.text);
    case 'Heading':
      return countWords(block.text);
    case 'Quote':
      return countWords(block.text) + (block.attribution ? countWords(block.attribution) : 0);
    case 'List':
      return block.items.reduce((acc, item) => acc + countWords(item), 0);
    case 'Image':
      return 0;
    case 'Code':
      return countWords(block.code);
    case 'Embed':
      return block.title ? countWords(block.title) : 0;
    case 'Callout':
      return countWords(block.title) + countWords(block.body);
    case 'Divider':
    default:
      return 0;
  }
}

export function computeReadingMinutes(blocks: ContentBlock[]): number {
  const words = blocks.reduce((acc, block) => acc + wordsInBlock(block), 0);
  if (words === 0) return 1;
  const minutes = Math.floor(words / WORDS_PER_MINUTE);
  return words % WORDS_PER_MINUTE === 0 ? minutes : minutes + 1;
}
