'use client';

import { useEffect, useMemo, useCallback, useState } from 'react';
import { type PartialBlock } from '@blocknote/core';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

interface Props {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
}

function parseContent(content: string): PartialBlock[] | undefined {
  if (!content) return undefined;
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // Not JSON — legacy markdown
  }
  const lines = content.split('\n').filter(Boolean);
  if (lines.length === 0) return undefined;
  return lines.map((line) => ({
    type: 'paragraph' as const,
    content: line,
  }));
}

function useSystemTheme(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(mq.matches ? 'dark' : 'light');
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return theme;
}

export function NotionEditor({ content, onChange, editable = true }: Props) {
  const initialContent = useMemo(() => parseContent(content), []);
  const theme = useSystemTheme();

  const editor = useCreateBlockNote({
    initialContent,
  });

  useEffect(() => {
    if (editor) {
      editor.isEditable = editable;
    }
  }, [editor, editable]);

  const handleChange = useCallback(() => {
    const blocks = editor.document;
    onChange(JSON.stringify(blocks));
  }, [editor, onChange]);

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      onChange={handleChange}
      theme={theme}
    />
  );
}
