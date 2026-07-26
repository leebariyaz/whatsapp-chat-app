import { useEffect, useState } from 'react';
import type { LinkPreview } from '@/types';

export function extractUrl(text: string): string | null {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}

export function useLinkPreview(text: string | null | undefined) {
  const [preview, setPreview] = useState<LinkPreview | null>(null);

  useEffect(() => {
    if (!text) { setPreview(null); return; }
    const url = extractUrl(text);
    if (!url) { setPreview(null); return; }

    let cancelled = false;
    setPreview({ url, title: null, description: null, thumbnail_url: null, domain: null });

    try {
      const domain = new URL(url).hostname.replace('www.', '');
      if (!cancelled) setPreview((p) => p ? { ...p, domain } : null);
    } catch { /* invalid url */ }

    // Fetch metadata via a CORS proxy (best-effort, non-blocking)
    fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data?.data) return;
        setPreview({
          url,
          title: data.data.title ?? null,
          description: data.data.description ?? null,
          thumbnail_url: data.data.image?.url ?? data.data.logo?.url ?? null,
          domain: data.data.url ? new URL(data.data.url).hostname.replace('www.', '') : null,
        });
      })
      .catch(() => { /* non-blocking */ });

    return () => { cancelled = true; };
  }, [text]);

  return preview;
}

export function LinkPreviewCard({ preview }: { preview: LinkPreview }) {
  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noreferrer"
      className="mt-2 flex gap-3 p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition border border-black/5 dark:border-white/10 max-w-64"
    >
      {preview.thumbnail_url && (
        <img src={preview.thumbnail_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        {preview.title && <p className="text-sm font-medium truncate">{preview.title}</p>}
        {preview.description && <p className="text-xs opacity-70 line-clamp-2 mt-0.5">{preview.description}</p>}
        {preview.domain && <p className="text-xs opacity-50 mt-1">{preview.domain}</p>}
      </div>
    </a>
  );
}
