'use client';

import { useEffect, useMemo, useCallback, useState } from 'react';
import { type PartialBlock } from '@blocknote/core';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

interface Props {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
  /** If provided, enables real-time collaboration for this note */
  collaborationId?: string;
  /** Current user info for cursor display */
  userName?: string;
  userColor?: string;
}

function parseContent(content: string): PartialBlock[] | undefined {
  if (!content) return undefined;
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
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
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return theme;
}

// Shared Yjs docs cache to prevent duplicate connections
const yjsDocs = new Map<string, { doc: Y.Doc; provider: WebrtcProvider; refCount: number }>();

function getOrCreateYjsDoc(roomId: string, userName: string, userColor: string) {
  const existing = yjsDocs.get(roomId);
  if (existing) {
    existing.refCount++;
    return existing;
  }

  const doc = new Y.Doc();
  const provider = new WebrtcProvider(roomId, doc, {
    signaling: ['wss://signaling.yjs.dev'],
  });

  // Set user awareness
  provider.awareness.setLocalStateField('user', {
    name: userName,
    color: userColor,
  });

  const entry = { doc, provider, refCount: 1 };
  yjsDocs.set(roomId, entry);
  return entry;
}

function releaseYjsDoc(roomId: string) {
  const entry = yjsDocs.get(roomId);
  if (!entry) return;
  entry.refCount--;
  if (entry.refCount <= 0) {
    entry.provider.destroy();
    entry.doc.destroy();
    yjsDocs.delete(roomId);
  }
}

export function NotionEditor({
  content,
  onChange,
  editable = true,
  collaborationId,
  userName = 'Anonym',
  userColor = '#4c6ef5',
}: Props) {
  const initialContent = useMemo(() => parseContent(content), []);
  const theme = useSystemTheme();

  // Set up Yjs collaboration if collaborationId is provided
  const collaboration = useMemo(() => {
    if (!collaborationId) return undefined;
    const roomId = `lernapp-note-${collaborationId}`;
    const { doc, provider } = getOrCreateYjsDoc(roomId, userName, userColor);
    return {
      fragment: doc.getXmlFragment('blocknote'),
      provider,
      user: { name: userName, color: userColor },
    };
  }, [collaborationId, userName, userColor]);

  // Cleanup Yjs on unmount
  useEffect(() => {
    if (!collaborationId) return;
    const roomId = `lernapp-note-${collaborationId}`;
    return () => releaseYjsDoc(roomId);
  }, [collaborationId]);

  const editor = useCreateBlockNote({
    initialContent: collaborationId ? undefined : initialContent,
    collaboration: collaboration
      ? {
          fragment: collaboration.fragment,
          provider: collaboration.provider,
          user: collaboration.user,
        }
      : undefined,
  });

  useEffect(() => {
    if (editor) {
      editor.isEditable = editable;
    }
  }, [editor, editable]);

  const handleChange = useCallback(() => {
    // Only save to Firestore if not in collab mode (collab syncs via Yjs)
    // But we still save periodically as a backup
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
