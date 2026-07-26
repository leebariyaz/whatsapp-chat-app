import type { ReactNode } from 'react';

// Parse markdown-like formatting and return React nodes
// Supports: **bold**, *italic*, _underline_, ~~strikethrough~~, `inline code`, ```code blocks```, - bullet lists, 1. numbered lists

export function formatMessage(text: string): ReactNode[] {
  const lines = text.split('\n');
  const nodes: ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    // Code block
    if (line.startsWith('```')) {
      const code = line.replace(/```/g, '');
      nodes.push(
        <pre key={`code-${lineIdx}`} className="my-1 p-2 rounded-lg bg-black/10 dark:bg-black/30 text-xs font-mono overflow-x-auto">
          <code>{code || '\n'}</code>
        </pre>
      );
      return;
    }

    // Bullet list
    if (/^[-*]\s/.test(line)) {
      nodes.push(
        <div key={`bullet-${lineIdx}`} className="flex gap-2 my-0.5">
          <span className="text-current">•</span>
          <span>{parseInline(line.replace(/^[-*]\s/, ''))}</span>
        </div>
      );
      return;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1] ?? '';
      nodes.push(
        <div key={`num-${lineIdx}`} className="flex gap-2 my-0.5">
          <span className="text-current">{num}.</span>
          <span>{parseInline(line.replace(/^\d+\.\s/, ''))}</span>
        </div>
      );
      return;
    }

    // Regular line with inline formatting
    nodes.push(<span key={`line-${lineIdx}`}>{parseInline(line)}</span>);
    if (lineIdx < lines.length - 1) nodes.push(<br key={`br-${lineIdx}`} />);
  });

  return nodes;
}

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    let match = remaining.match(/\*\*(.+?)\*\*/);
    if (match && match.index !== undefined) {
      if (match.index > 0) nodes.push(<span key={key++}>{remaining.slice(0, match.index)}</span>);
      nodes.push(<strong key={key++} className="font-bold">{match[1]}</strong>);
      remaining = remaining.slice(match.index + match[0].length);
      continue;
    }

    // Italic: *text*
    match = remaining.match(/\*(.+?)\*/);
    if (match && match.index !== undefined) {
      if (match.index > 0) nodes.push(<span key={key++}>{remaining.slice(0, match.index)}</span>);
      nodes.push(<em key={key++} className="italic">{match[1]}</em>);
      remaining = remaining.slice(match.index + match[0].length);
      continue;
    }

    // Strikethrough: ~~text~~
    match = remaining.match(/~~(.+?)~~/);
    if (match && match.index !== undefined) {
      if (match.index > 0) nodes.push(<span key={key++}>{remaining.slice(0, match.index)}</span>);
      nodes.push(<s key={key++}>{match[1]}</s>);
      remaining = remaining.slice(match.index + match[0].length);
      continue;
    }

    // Inline code: `text`
    match = remaining.match(/`(.+?)`/);
    if (match && match.index !== undefined) {
      if (match.index > 0) nodes.push(<span key={key++}>{remaining.slice(0, match.index)}</span>);
      nodes.push(<code key={key++} className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 text-xs font-mono">{match[1]}</code>);
      remaining = remaining.slice(match.index + match[0].length);
      continue;
    }

    // No more matches
    nodes.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return nodes;
}

// Formatting toolbar helpers
export const FORMAT_ACTIONS = {
  bold: (text: string) => `**${text}**`,
  italic: (text: string) => `*${text}*`,
  strikethrough: (text: string) => `~~${text}~~`,
  code: (text: string) => `\`${text}\``,
  bullet: (text: string) => `- ${text}`,
  number: (text: string) => `1. ${text}`,
} as const;

export type FormatAction = keyof typeof FORMAT_ACTIONS;
