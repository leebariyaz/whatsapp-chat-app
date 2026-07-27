import type { ReactNode } from 'react';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

// Parse markdown-like formatting and return React nodes
// Supports: **bold**, *italic*, _underline_, ~~strikethrough~~, `inline code`,
// ```multi-line code blocks```, - bullet lists, 1. numbered lists

export function formatMessage(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Multi-line code block: ```lang\n...\n```
    const codeBlockMatch = remaining.match(/^```(\w*)\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
      const lang = codeBlockMatch[1] || '';
      const code = codeBlockMatch[2].replace(/\n$/, '');
      nodes.push(<CodeBlock key={`code-${key++}`} code={code} lang={lang} />);
      remaining = remaining.slice(codeBlockMatch[0].length);
      // Skip leading newline after code block
      remaining = remaining.replace(/^\n/, '');
      continue;
    }

    // Single-line code block: ```code```
    const inlineCodeBlockMatch = remaining.match(/^```(.+?)```/);
    if (inlineCodeBlockMatch) {
      nodes.push(
        <pre key={`code-${key++}`} className="my-1 p-2 rounded-lg bg-black/10 dark:bg-black/30 text-xs font-mono overflow-x-auto">
          <code>{inlineCodeBlockMatch[1]}</code>
        </pre>
      );
      remaining = remaining.slice(inlineCodeBlockMatch[0].length);
      continue;
    }

    // Find the next code block start
    const nextCodeBlock = remaining.indexOf('```');
    if (nextCodeBlock === -1) {
      // No more code blocks, parse the rest line by line
      parseLines(remaining, nodes, key);
      key += 1000;
      break;
    }

    // Parse lines before the code block
    if (nextCodeBlock > 0) {
      const before = remaining.slice(0, nextCodeBlock);
      parseLines(before, nodes, key);
      key += 100;
      remaining = remaining.slice(nextCodeBlock);
    } else {
      // Code block at start but didn't match the full pattern — treat as text
      // This handles unclosed code blocks
      const lineEnd = remaining.indexOf('\n');
      if (lineEnd === -1) {
        nodes.push(<span key={`text-${key++}`}>{parseInline(remaining)}</span>);
        break;
      }
      parseLines(remaining.slice(0, lineEnd + 1), nodes, key);
      key += 10;
      remaining = remaining.slice(lineEnd + 1);
    }
  }

  return nodes;
}

function parseLines(text: string, nodes: ReactNode[], baseKey: number) {
  const lines = text.split('\n');
  lines.forEach((line, lineIdx) => {
    // Bullet list
    if (/^[-*]\s/.test(line)) {
      nodes.push(
        <div key={`bullet-${baseKey}-${lineIdx}`} className="flex gap-2 my-0.5">
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
        <div key={`num-${baseKey}-${lineIdx}`} className="flex gap-2 my-0.5">
          <span className="text-current">{num}.</span>
          <span>{parseInline(line.replace(/^\d+\.\s/, ''))}</span>
        </div>
      );
      return;
    }

    // Empty line
    if (line === '') {
      nodes.push(<br key={`br-${baseKey}-${lineIdx}`} />);
      return;
    }

    // Regular line with inline formatting
    nodes.push(<span key={`line-${baseKey}-${lineIdx}`}>{parseInline(line)}</span>);
    if (lineIdx < lines.length - 1) nodes.push(<br key={`br-${baseKey}-${lineIdx}`} />);
  });
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="my-1.5 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
      <div className="flex items-center justify-between px-2.5 py-1 bg-slate-100 dark:bg-slate-800">
        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">{lang || 'code'}</span>
        <button onClick={handleCopy} className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-2.5 bg-slate-50 dark:bg-black/30 text-xs font-mono overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
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
