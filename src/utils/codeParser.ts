export type MessageSegment =
  | { type: 'text'; content: string }
  | { type: 'code'; content: string; language: string };

export interface ParsedMessage {
  segments: MessageSegment[];
}

const CODE_BLOCK_REGEX = /(```|~~~)([^\n]*)\n([\s\S]*?)\1/g;

const sanitizeInlineHtml = (value: string): string => {
  // Strip unwanted formatting from text segments only (not code)
  // Keep inline HTML links intact, remove only formatting tags
  return value
    .replace(/<(?!a\s|\/a>)[^>]+>/g, '') // Remove HTML tags except <a> tags for links
    .replace(/\*\*(.+?)\*\*/g, '$1'); // Remove ** bold markers
};

export const parseMessageForCode = (content: string): ParsedMessage => {
  const segments: MessageSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = CODE_BLOCK_REGEX.exec(content)) !== null) {
    const fullMatch = match[0];
    const languageRaw = (match[2] || '').trim();
    const rawCode = (match[3] || '').trim();
    const precedingText = content.slice(lastIndex, match.index);

    if (precedingText.trim()) {
      segments.push({
        type: 'text',
        content: sanitizeInlineHtml(precedingText.trim()),
      });
    }

    segments.push({
      type: 'code',
      content: rawCode,
      language: (languageRaw || 'text').toLowerCase(),
    });

    lastIndex = match.index + fullMatch.length;
  }

  const remainingText = content.slice(lastIndex);
  if (remainingText.trim()) {
    segments.push({
      type: 'text',
      content: sanitizeInlineHtml(remainingText.trim()),
    });
  }

  return { segments };
};

export const hasCodeBlock = (content: string): boolean => {
  return /(```|~~~)[\s\S]*?\1/.test(content);
};
