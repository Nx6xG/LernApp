'use client';

import { useEffect, useState } from 'react';
import { useWorkspaceContext } from '@/hooks/useWorkspaceContext';
import { useAppStore } from '@/stores/app-store';
import { Plus, Play, Trash2, Edit2, Sparkles, Layers } from 'lucide-react';
import type { Deck, Flashcard } from '@/types';
import { FlashcardStudy } from '@/components/karteikarten/FlashcardStudy';
import { AIGenerateModal } from '@/components/ui/AIGenerateModal';

export default function KarteikartenPage() {
  const { uid, workspaceId } = useWorkspaceContext();
  const { decks, flashcards, loadDecks, loadFlashcards, addDeck, removeDeck, addFlashcard } = useAppStore();

  const [showNewDeck, setShowNewDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [studyMode, setStudyMode] = useState(false);
  const [showNewCard, setShowNewCard] = useState(false);
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    if (workspaceId) loadDecks(workspaceId);
  }, [workspaceId]);

  useEffect(() => {
    if (selectedDeck) loadFlashcards(selectedDeck.id);
  }, [selectedDeck]);

  const deckColors = ['#4c6ef5', '#40c057', '#fab005', '#fa5252', '#7950f2', '#15aabf', '#e64980', '#fd7e14'];

  const handleCreateDeck = async () => {
    if (!uid || !workspaceId || !newDeckName.trim()) return;
    const color = deckColors[decks.length % deckColors.length];
    await addDeck({
      workspaceId,
      userId: uid,
      name: newDeckName,
      description: newDeckDesc,
      color,
      cardCount: 0,
      dueCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setNewDeckName('');
    setNewDeckDesc('');
    setShowNewDeck(false);
  };

  const handleCreateCard = async () => {
    if (!selectedDeck || !newCardFront.trim() || !newCardBack.trim()) return;
    await addFlashcard({
      deckId: selectedDeck.id,
      front: newCardFront,
      back: newCardBack,
      tags: [],
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setNewCardFront('');
    setNewCardBack('');
    setShowNewCard(false);
  };

  const handleAIGenerated = async (cards: Array<{ front: string; back: string }>) => {
    if (!selectedDeck) return;
    for (const card of cards) {
      await addFlashcard({
        deckId: selectedDeck.id,
        front: card.front,
        back: card.back,
        tags: [],
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    setShowAI(false);
  };

  const currentCards = selectedDeck ? flashcards[selectedDeck.id] || [] : [];
  const dueCards = currentCards.filter((c) => new Date(c.nextReview) <= new Date());

  // Study mode
  if (studyMode && selectedDeck) {
    return (
      <FlashcardStudy
        cards={dueCards.length > 0 ? dueCards : currentCards}
        deckName={selectedDeck.name}
        onExit={() => setStudyMode(false)}
      />
    );
  }

  // Deck detail view
  if (selectedDeck) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => setSelectedDeck(null)}
              className="text-sm text-primary-600 hover:text-primary-700 mb-2"
            >
              &larr; Alle Stapel
            </button>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {selectedDeck.name}
            </h1>
            <p className="text-neutral-500 mt-1">
              {currentCards.length} Karten &middot; {dueCards.length} fällig
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAI(true)} className="btn-secondary flex items-center gap-2">
              <Sparkles size={16} />
              KI-Generierung
            </button>
            <button
              onClick={() => setStudyMode(true)}
              className="btn-primary flex items-center gap-2"
              disabled={currentCards.length === 0}
            >
              <Play size={16} />
              Lernen
            </button>
          </div>
        </div>

        {/* Add card form */}
        {showNewCard ? (
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-neutral-900 dark:text-white">Neue Karteikarte</h3>
            <div>
              <label className="label">Vorderseite (Frage)</label>
              <textarea
                className="input min-h-[80px]"
                value={newCardFront}
                onChange={(e) => setNewCardFront(e.target.value)}
                placeholder="z.B. Was ist Photosynthese?"
              />
            </div>
            <div>
              <label className="label">Rückseite (Antwort)</label>
              <textarea
                className="input min-h-[80px]"
                value={newCardBack}
                onChange={(e) => setNewCardBack(e.target.value)}
                placeholder="z.B. Der Prozess, bei dem Pflanzen Licht in Energie umwandeln..."
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreateCard} className="btn-primary">
                Erstellen
              </button>
              <button onClick={() => setShowNewCard(false)} className="btn-secondary">
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNewCard(true)}
            className="card p-4 w-full text-left hover:shadow-md transition-shadow border-dashed border-2 border-neutral-300 dark:border-neutral-600 bg-transparent flex items-center gap-3 text-neutral-500 hover:text-primary-600"
          >
            <Plus size={20} />
            Neue Karteikarte hinzufügen
          </button>
        )}

        {/* Card list */}
        <div className="space-y-3">
          {currentCards.map((card) => (
            <div key={card.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-neutral-900 dark:text-white">{card.front}</p>
                  <p className="text-sm text-neutral-500 mt-1">{card.back}</p>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  {new Date(card.nextReview) <= new Date() && (
                    <span className="badge bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                      Fällig
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Generate Modal */}
        {showAI && (
          <AIGenerateModal
            type="flashcards"
            onGenerate={handleAIGenerated}
            onClose={() => setShowAI(false)}
          />
        )}
      </div>
    );
  }

  // Deck list view
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Karteikarten</h1>
          <p className="text-neutral-500 mt-1">Erstelle und verwalte deine Kartenstapel</p>
        </div>
        <button onClick={() => setShowNewDeck(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Neuer Stapel
        </button>
      </div>

      {/* New deck form */}
      {showNewDeck && (
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-neutral-900 dark:text-white">Neuer Kartenstapel</h3>
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              placeholder="z.B. Biologie Kapitel 3"
            />
          </div>
          <div>
            <label className="label">Beschreibung (optional)</label>
            <input
              className="input"
              value={newDeckDesc}
              onChange={(e) => setNewDeckDesc(e.target.value)}
              placeholder="Kurze Beschreibung"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreateDeck} className="btn-primary">
              Erstellen
            </button>
            <button onClick={() => setShowNewDeck(false)} className="btn-secondary">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Deck grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {decks.map((deck) => (
          <button
            key={deck.id}
            onClick={() => setSelectedDeck(deck)}
            className="card p-5 text-left hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between">
              <div>
                <div
                  className="w-3 h-3 rounded-full mb-3"
                  style={{ backgroundColor: deck.color }}
                />
                <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600 transition-colors">
                  {deck.name}
                </h3>
                {deck.description && (
                  <p className="text-sm text-neutral-500 mt-1">{deck.description}</p>
                )}
                <p className="text-xs text-neutral-400 mt-2">
                  {deck.cardCount} Karten &middot; {deck.dueCount} fällig
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Stapel wirklich löschen?')) removeDeck(deck.id);
                }}
                className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </button>
        ))}
      </div>

      {decks.length === 0 && !showNewDeck && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
            <Layers size={32} className="text-primary-600" />
          </div>
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
            Noch keine Kartenstapel
          </h3>
          <p className="text-neutral-500 mb-4">
            Erstelle deinen ersten Stapel und beginne zu lernen!
          </p>
          <button onClick={() => setShowNewDeck(true)} className="btn-primary">
            Ersten Stapel erstellen
          </button>
        </div>
      )}
    </div>
  );
}
