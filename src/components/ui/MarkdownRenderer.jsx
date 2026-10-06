import React, { useMemo } from 'react';
import { marked } from 'marked';

export function MarkdownRenderer({ content, className = '' }) {
  const html = useMemo(() => {
    if (!content) return '';
    try {
      return marked.parse(content, { breaks: true, gfm: true });
    } catch {
      return content;
    }
  }, [content]);

  return (
    <div
      className={`ai-markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
