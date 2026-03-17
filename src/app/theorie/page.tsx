'use client';

import { useEffect, useState, useMemo } from 'react';
import { useWorkspaceContext } from '@/hooks/useWorkspaceContext';
import { useAppStore } from '@/stores/app-store';
import { Plus, BookOpen, Trash2, Edit2, Save, X, Sparkles, Tag, Lock } from 'lucide-react';
import type { TheoryNote } from '@/types';
import { AIGenerateModal } from '@/components/ui/AIGenerateModal';
import dynamic from 'next/dynamic';

// Lazy load the editor to avoid SSR issues
const NotionEditor = dynamic(
  () => import('@/components/theorie/NotionEditor').then((m) => m.NotionEditor),
  { ssr: false, loading: () => <div className="h-96 flex items-center justify-center text-neutral-400">Editor lädt...</div> }
);

export default function TheoriePage() {
  const { uid, workspaceId } = useWorkspaceContext();
  const {
    theoryNotes,
    subjects,
    loadTheoryNotes,
    loadSubjects,
    addTheoryNote,
    editTheoryNote,
    removeTheoryNote,
    addSubject,
  } = useAppStore();

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<TheoryNote | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      loadSubjects(workspaceId);
      loadTheoryNotes(workspaceId);
    }
  }, [workspaceId]);

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    theoryNotes.forEach((n) => n.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [theoryNotes]);

  const filteredNotes = selectedTag
    ? theoryNotes.filter((n) => n.tags?.includes(selectedTag))
    : theoryNotes;

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !editTags.includes(trimmed)) {
      setEditTags([...editTags, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setEditTags(editTags.filter((t) => t !== tag));
  };

  const handleCreateNote = async () => {
    if (!uid || !workspaceId || !editTitle.trim()) return;
    const id = await addTheoryNote({
      workspaceId,
      userId: uid,
      subjectId: 'general',
      title: editTitle,
      content: editContent,
      tags: editTags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setSelectedNote({
      id,
      workspaceId,
      userId: uid,
      subjectId: 'general',
      title: editTitle,
      content: editContent,
      tags: editTags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setEditing(false);
    setShowNew(false);
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    await editTheoryNote(selectedNote.id, {
      title: editTitle,
      content: editContent,
      tags: editTags,
      updatedAt: new Date().toISOString(),
    });
    setSelectedNote({ ...selectedNote, title: editTitle, content: editContent, tags: editTags });
    setEditing(false);
  };

  const handleAISummary = async (summary: string) => {
    // AI returns markdown — for now append as a paragraph block
    if (editing) {
      try {
        const current = editContent ? JSON.parse(editContent) : [];
        const newBlock = { type: 'paragraph', content: summary };
        setEditContent(JSON.stringify([...current, newBlock]));
      } catch {
        // If content isn't JSON yet, just set it
        const block = [{ type: 'paragraph', content: summary }];
        setEditContent(JSON.stringify(block));
      }
    }
    setShowAI(false);
  };

  const startEdit = (note: TheoryNote) => {
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags || []);
    setEditing(true);
  };

  // Helper to get a text preview from content
  const getPreview = (content: string): string => {
    try {
      const blocks = JSON.parse(content);
      if (Array.isArray(blocks)) {
        for (const block of blocks) {
          if (block.content) {
            if (typeof block.content === 'string') return block.content;
            if (Array.isArray(block.content)) {
              const text = block.content.map((c: any) => c.text || '').join('');
              if (text) return text;
            }
          }
        }
      }
    } catch {
      return content?.slice(0, 150) || '';
    }
    return 'Kein Inhalt';
  };

  // ==================== Note Detail View ====================
  if (selectedNote && !showNew) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setSelectedNote(null); setEditing(false); }}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            &larr; Alle Notizen
          </button>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={() => setShowAI(true)} className="btn-secondary flex items-center gap-2">
                  <Sparkles size={16} />
                  KI-Hilfe
                </button>
                <button onClick={handleSaveNote} className="btn-primary flex items-center gap-2">
                  <Save size={16} />
                  Speichern
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditTitle(selectedNote.title);
                    setEditContent(selectedNote.content);
                    setEditTags(selectedNote.tags || []);
                  }}
                  className="btn-secondary"
                >
                  Abbrechen
                </button>
              </>
            ) : (
              <>
                <button onClick={() => startEdit(selectedNote)} className="btn-secondary flex items-center gap-2">
                  <Edit2 size={16} />
                  Bearbeiten
                </button>
                <button
                  onClick={() => {
                    if (confirm('Notiz löschen?')) {
                      removeTheoryNote(selectedNote.id);
                      setSelectedNote(null);
                    }
                  }}
                  className="btn-danger flex items-center gap-2"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        {editing ? (
          <input
            className="w-full text-3xl font-bold bg-transparent border-none outline-none text-neutral-900 dark:text-white placeholder-neutral-300"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Ohne Titel"
          />
        ) : (
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            {selectedNote.title}
          </h1>
        )}

        {/* Tags */}
        {editing ? (
          <TagEditor
            tags={editTags}
            tagInput={tagInput}
            setTagInput={setTagInput}
            addTag={addTag}
            removeTag={removeTag}
            suggestions={allTags}
          />
        ) : (
          selectedNote.tags?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {selectedNote.tags.map((tag) => (
                <span key={tag} className="badge bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                  <Tag size={10} className="mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )
        )}

        {/* Editor */}
        <div className="min-h-[300px] sm:min-h-[500px] rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden bg-white dark:bg-neutral-800">
          <NotionEditor
            key={`${selectedNote.id}-${editing}`}
            content={editing ? editContent : selectedNote.content}
            onChange={setEditContent}
            editable={editing}
          />
        </div>

        {showAI && (
          <AIGenerateModal type="summary" onGenerate={handleAISummary} onClose={() => setShowAI(false)} />
        )}
      </div>
    );
  }

  // ==================== Note List ====================
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Theorie</h1>
          <p className="text-neutral-500 mt-1">Notizen und Erklärungen zu deinen Themen</p>
        </div>
        <button
          onClick={() => {
            setShowNew(true);
            setEditing(true);
            setEditTitle('');
            setEditContent('');
            setEditTags([]);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Neue Notiz
        </button>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Tag size={14} className="text-neutral-400" />
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !selectedTag
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
            }`}
          >
            Alle
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedTag === tag
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* New note — inline Notion editor */}
      {showNew && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden">
          <div className="p-6 pb-0 space-y-4">
            <input
              className="w-full text-2xl font-bold bg-transparent border-none outline-none text-neutral-900 dark:text-white placeholder-neutral-300"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Titel der Notiz"
              autoFocus
            />
            <TagEditor
              tags={editTags}
              tagInput={tagInput}
              setTagInput={setTagInput}
              addTag={addTag}
              removeTag={removeTag}
              suggestions={allTags}
            />
          </div>
          <div className="min-h-[300px]">
            <NotionEditor
              content={editContent}
              onChange={setEditContent}
              editable={true}
            />
          </div>
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 flex gap-2">
            <button onClick={handleCreateNote} className="btn-primary">
              Erstellen
            </button>
            <button onClick={() => { setShowNew(false); setEditing(false); }} className="btn-secondary">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Notes list */}
      <div className="space-y-3">
        {filteredNotes.map((note) => (
          <button
            key={note.id}
            onClick={() => setSelectedNote(note)}
            className="card p-5 w-full text-left hover:shadow-md transition-shadow group"
          >
            <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600 transition-colors">
              {note.title}
            </h3>
            <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
              {getPreview(note.content)}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {note.tags?.map((tag) => (
                <span key={tag} className="badge bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs">
                  {tag}
                </span>
              ))}
              <span className="text-xs text-neutral-400">
                {new Date(note.updatedAt).toLocaleDateString('de-DE')}
              </span>
            </div>
          </button>
        ))}
      </div>

      {filteredNotes.length === 0 && !showNew && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} className="text-green-600" />
          </div>
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
            {selectedTag ? `Keine Notizen mit Tag "${selectedTag}"` : 'Noch keine Notizen'}
          </h3>
          <p className="text-neutral-500 mb-4">
            {selectedTag ? 'Wähle einen anderen Tag oder erstelle eine neue Notiz.' : 'Erstelle deine erste Theorie-Notiz!'}
          </p>
          <button
            onClick={() => {
              setShowNew(true);
              setEditing(true);
              setEditTitle('');
              setEditContent('');
              setEditTags(selectedTag ? [selectedTag] : []);
            }}
            className="btn-primary"
          >
            {selectedTag ? 'Notiz mit diesem Tag erstellen' : 'Erste Notiz erstellen'}
          </button>
        </div>
      )}
    </div>
  );
}

// ==================== Tag Editor Component ====================

function TagEditor({
  tags,
  tagInput,
  setTagInput,
  addTag,
  removeTag,
  suggestions,
}: {
  tags: string[];
  tagInput: string;
  setTagInput: (v: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  suggestions: string[];
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = suggestions.filter(
    (s) => s.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(s)
  );

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium"
          >
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors ml-0.5">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          className="input text-sm py-1.5"
          value={tagInput}
          onChange={(e) => { setTagInput(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && tagInput.trim()) {
              e.preventDefault();
              addTag(tagInput);
              setShowSuggestions(false);
            }
            if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
              removeTag(tags[tags.length - 1]);
            }
          }}
          placeholder="Tags hinzufügen... (Enter zum Bestätigen)"
        />
        {showSuggestions && tagInput && filteredSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-10 card p-1 shadow-lg max-h-40 overflow-y-auto">
            {filteredSuggestions.map((s) => (
              <button
                key={s}
                onMouseDown={(e) => { e.preventDefault(); addTag(s); setShowSuggestions(false); }}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
