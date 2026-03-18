'use client';

import { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { type PartialBlock } from '@blocknote/core';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

interface Props {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
  collaborationId?: string;
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

function useThemeWatch(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return theme;
}

/**
 * Standard editor without collaboration.
 */
function StandardEditor({ content, onChange, editable, theme }: {
  content: string; onChange: (c: string) => void; editable: boolean; theme: 'light' | 'dark';
}) {
  const initialContent = useMemo(() => parseContent(content), [content]);

  const editor = useCreateBlockNote({ initialContent });

  useEffect(() => {
    if (editor) editor.isEditable = editable;
  }, [editor, editable]);

  const handleChange = useCallback(() => {
    onChange(JSON.stringify(editor.document));
  }, [editor, onChange]);

  return (
    <BlockNoteView editor={editor} editable={editable} onChange={handleChange} theme={theme} />
  );
}

/**
 * Collaborative editor with Yjs — loaded lazily.
 */
function CollabEditor({ content, onChange, editable, theme, collaborationId, userName, userColor }: {
  content: string; onChange: (c: string) => void; editable: boolean; theme: 'light' | 'dark';
  collaborationId: string; userName: string; userColor: string;
}) {
  const [collabReady, setCollabReady] = useState(false);
  const collabRef = useRef<any>(null);

  // Dynamically import Yjs only when needed
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const Y = await import('yjs');
        const { WebrtcProvider } = await import('y-webrtc');

        if (cancelled) return;

        const doc = new Y.Doc();
        const provider = new WebrtcProvider(`lernapp-note-${collaborationId}`, doc, {
          signaling: ['wss://signaling.yjs.dev'],
        });
        provider.awareness.setLocalStateField('user', { name: userName, color: userColor });

        collabRef.current = {
          fragment: doc.getXmlFragment('blocknote'),
          provider,
          user: { name: userName, color: userColor },
          doc,
        };
        setCollabReady(true);
      } catch (err) {
        console.error('Collaboration init failed, falling back to standard editor', err);
      }
    })();

    return () => {
      cancelled = true;
      if (collabRef.current) {
        collabRef.current.provider.destroy();
        collabRef.current.doc.destroy();
        collabRef.current = null;
      }
      setCollabReady(false);
    };
  }, [collaborationId, userName, userColor]);

  if (!collabReady || !collabRef.current) {
    return <StandardEditor content={content} onChange={onChange} editable={editable} theme={theme} />;
  }

  return (
    <CollabEditorInner
      collab={collabRef.current}
      initialContent={content}
      onChange={onChange}
      editable={editable}
      theme={theme}
    />
  );
}

function CollabEditorInner({ collab, initialContent, onChange, editable, theme }: {
  collab: any; initialContent: string; onChange: (c: string) => void; editable: boolean; theme: 'light' | 'dark';
}) {
  const hasInitialized = useRef(false);

  const editor = useCreateBlockNote({
    collaboration: {
      fragment: collab.fragment,
      provider: collab.provider,
      user: collab.user,
    },
  });

  // If Yjs doc is empty (we're the first editor), load existing content
  useEffect(() => {
    if (!editor || hasInitialized.current) return;
    hasInitialized.current = true;

    // Wait a short moment for potential sync from other peers
    const timer = setTimeout(() => {
      const blocks = editor.document;
      const isEmpty = blocks.length === 0 ||
        (blocks.length === 1 && blocks[0].type === 'paragraph' &&
          (blocks[0].content === undefined || blocks[0].content?.length === 0 ||
           (Array.isArray(blocks[0].content) && blocks[0].content.length === 1 &&
            (blocks[0].content[0] as any)?.text === '')));

      if (isEmpty && initialContent) {
        const parsed = parseContent(initialContent);
        if (parsed && parsed.length > 0) {
          try {
            editor.replaceBlocks(editor.document, parsed);
          } catch {
            // fallback: insert at end
            try {
              editor.insertBlocks(parsed, editor.document[0], 'before');
            } catch {}
          }
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [editor, initialContent]);

  useEffect(() => {
    if (editor) editor.isEditable = editable;
  }, [editor, editable]);

  const handleChange = useCallback(() => {
    onChange(JSON.stringify(editor.document));
  }, [editor, onChange]);

  return (
    <BlockNoteView editor={editor} editable={editable} onChange={handleChange} theme={theme} />
  );
}

/**
 * Main export — routes to standard or collaborative editor.
 */
export function NotionEditor({
  content,
  onChange,
  editable = true,
  collaborationId,
  userName = 'Anonym',
  userColor = '#4c6ef5',
}: Props) {
  const theme = useThemeWatch();

  if (collaborationId) {
    return (
      <CollabEditor
        content={content}
        onChange={onChange}
        editable={editable}
        theme={theme}
        collaborationId={collaborationId}
        userName={userName}
        userColor={userColor}
      />
    );
  }

  return (
    <StandardEditor content={content} onChange={onChange} editable={editable} theme={theme} />
  );
}
