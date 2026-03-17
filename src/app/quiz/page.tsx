'use client';

import { useEffect, useState } from 'react';
import { useWorkspaceContext } from '@/hooks/useWorkspaceContext';
import { useAppStore } from '@/stores/app-store';
import { Plus, Play, Trash2, Sparkles, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import type { Quiz, QuizQuestion, QuestionType } from '@/types';
import { AIGenerateModal } from '@/components/ui/AIGenerateModal';

export default function QuizPage() {
  const { uid, workspaceId } = useWorkspaceContext();
  const { quizzes, loadQuizzes, addQuiz, removeQuiz, editQuiz } = useAppStore();

  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [playMode, setPlayMode] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showAI, setShowAI] = useState(false);

  // Question form
  const [qType, setQType] = useState<QuestionType>('multiple-choice');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState('');
  const [qExplanation, setQExplanation] = useState('');

  // Play state
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answerRevealed, setAnswerRevealed] = useState(false);

  useEffect(() => {
    if (workspaceId) loadQuizzes(workspaceId);
  }, [workspaceId]);

  const handleCreateQuiz = async () => {
    if (!uid || !workspaceId || !newTitle.trim()) return;
    const id = await addQuiz({
      workspaceId,
      userId: uid,
      title: newTitle,
      description: newDesc,
      questions: [],
      recallInterval: 1,
      timesCompleted: 0,
      averageScore: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setNewTitle('');
    setNewDesc('');
    setShowNew(false);
  };

  const handleAddQuestion = async () => {
    if (!selectedQuiz || !qText.trim()) return;
    const newQ: QuizQuestion = {
      id: Date.now().toString(),
      quizId: selectedQuiz.id,
      type: qType,
      question: qText,
      options: qType === 'multiple-choice' ? qOptions.filter(Boolean) : undefined,
      correctAnswer: qType === 'true-false' ? qCorrect : qCorrect,
      explanation: qExplanation || undefined,
      points: 1,
      createdAt: new Date().toISOString(),
    };
    const updated = [...selectedQuiz.questions, newQ];
    await editQuiz(selectedQuiz.id, { questions: updated, updatedAt: new Date().toISOString() });
    setSelectedQuiz({ ...selectedQuiz, questions: updated });
    resetQuestionForm();
  };

  const handleAIGenerated = async (questions: any[]) => {
    if (!selectedQuiz) return;
    const newQs: QuizQuestion[] = questions.map((q, i) => ({
      id: `${Date.now()}-${i}`,
      quizId: selectedQuiz.id,
      type: q.type || 'multiple-choice',
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      points: 1,
      createdAt: new Date().toISOString(),
    }));
    const updated = [...selectedQuiz.questions, ...newQs];
    await editQuiz(selectedQuiz.id, { questions: updated, updatedAt: new Date().toISOString() });
    setSelectedQuiz({ ...selectedQuiz, questions: updated });
    setShowAI(false);
  };

  const resetQuestionForm = () => {
    setQType('multiple-choice');
    setQText('');
    setQOptions(['', '', '', '']);
    setQCorrect('');
    setQExplanation('');
    setShowAddQuestion(false);
  };

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setAnswerRevealed(true);
    setAnswers((prev) => ({ ...prev, [currentQuestion!.id]: answer }));
  };

  const nextQuestion = () => {
    if (currentQ < selectedQuiz!.questions.length - 1) {
      setCurrentQ((c) => c + 1);
      setSelectedAnswer('');
      setAnswerRevealed(false);
    } else {
      setShowResult(true);
    }
  };

  const currentQuestion = selectedQuiz?.questions[currentQ];
  const score = selectedQuiz
    ? Object.entries(answers).filter(
        ([qId, a]) => selectedQuiz.questions.find((q) => q.id === qId)?.correctAnswer === a
      ).length
    : 0;

  // Play mode
  if (playMode && selectedQuiz && currentQuestion) {
    if (showResult) {
      return (
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">{score / selectedQuiz.questions.length >= 0.7 ? '🎉' : '💪'}</span>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Ergebnis: {score} / {selectedQuiz.questions.length}
          </h2>
          <p className="text-neutral-500 mb-2">
            {Math.round((score / selectedQuiz.questions.length) * 100)}% richtig
          </p>
          <p className="text-sm text-neutral-400 mb-6">
            {score / selectedQuiz.questions.length >= 0.7
              ? 'Großartige Leistung! Weiter so!'
              : 'Übung macht den Meister. Versuch es nochmal!'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setPlayMode(false);
                setCurrentQ(0);
                setAnswers({});
                setShowResult(false);
                setAnswerRevealed(false);
              }}
              className="btn-secondary"
            >
              Zurück
            </button>
            <button
              onClick={() => {
                setCurrentQ(0);
                setAnswers({});
                setShowResult(false);
                setSelectedAnswer('');
                setAnswerRevealed(false);
              }}
              className="btn-primary"
            >
              Nochmal
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Frage {currentQ + 1} von {selectedQuiz.questions.length}
          </p>
          <button
            onClick={() => {
              setPlayMode(false);
              setCurrentQ(0);
              setAnswers({});
              setAnswerRevealed(false);
            }}
            className="text-sm text-neutral-500 hover:text-neutral-700"
          >
            Beenden
          </button>
        </div>

        <div className="w-full bg-neutral-100 dark:bg-neutral-700 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentQ + 1) / selectedQuiz.questions.length) * 100}%` }}
          />
        </div>

        <div className="card p-8">
          <p className="text-lg font-medium text-neutral-900 dark:text-white mb-6">
            {currentQuestion.question}
          </p>

          {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((opt, i) => {
                const isCorrect = opt === currentQuestion.correctAnswer;
                const isSelected = selectedAnswer === opt;
                let className =
                  'w-full text-left p-4 rounded-xl border-2 transition-colors ';
                if (answerRevealed) {
                  if (isCorrect)
                    className += 'border-green-500 bg-green-50 dark:bg-green-900/20';
                  else if (isSelected)
                    className += 'border-red-500 bg-red-50 dark:bg-red-900/20';
                  else className += 'border-neutral-200 dark:border-neutral-600 opacity-50';
                } else {
                  className +=
                    'border-neutral-200 dark:border-neutral-600 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/10';
                }
                return (
                  <button
                    key={i}
                    onClick={() => !answerRevealed && handleAnswer(opt)}
                    className={className}
                    disabled={answerRevealed}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-sm font-medium">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-neutral-900 dark:text-white">{opt}</span>
                      {answerRevealed && isCorrect && (
                        <CheckCircle2 size={18} className="text-green-500 ml-auto" />
                      )}
                      {answerRevealed && isSelected && !isCorrect && (
                        <XCircle size={18} className="text-red-500 ml-auto" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'true-false' && (
            <div className="grid grid-cols-2 gap-4">
              {['Wahr', 'Falsch'].map((opt) => {
                const isCorrect = opt === currentQuestion.correctAnswer;
                const isSelected = selectedAnswer === opt;
                let className = 'p-4 rounded-xl border-2 text-center font-medium transition-colors ';
                if (answerRevealed) {
                  if (isCorrect) className += 'border-green-500 bg-green-50 dark:bg-green-900/20';
                  else if (isSelected) className += 'border-red-500 bg-red-50 dark:bg-red-900/20';
                  else className += 'border-neutral-200 dark:border-neutral-600 opacity-50';
                } else {
                  className +=
                    'border-neutral-200 dark:border-neutral-600 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/10';
                }
                return (
                  <button
                    key={opt}
                    onClick={() => !answerRevealed && handleAnswer(opt)}
                    className={className}
                    disabled={answerRevealed}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'free-text' && (
            <div className="space-y-3">
              <input
                className="input"
                placeholder="Deine Antwort..."
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                disabled={answerRevealed}
                onKeyDown={(e) => e.key === 'Enter' && !answerRevealed && handleAnswer(selectedAnswer)}
              />
              {!answerRevealed && (
                <button onClick={() => handleAnswer(selectedAnswer)} className="btn-primary">
                  Antworten
                </button>
              )}
              {answerRevealed && (
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Richtige Antwort: <strong>{currentQuestion.correctAnswer}</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {answerRevealed && currentQuestion.explanation && (
            <div className="mt-4 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800">
              <p className="text-sm text-primary-700 dark:text-primary-300">
                <strong>Erklärung:</strong> {currentQuestion.explanation}
              </p>
            </div>
          )}

          {answerRevealed && (
            <button onClick={nextQuestion} className="btn-primary w-full mt-6">
              {currentQ < selectedQuiz.questions.length - 1 ? 'Nächste Frage' : 'Ergebnis anzeigen'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Quiz detail view
  if (selectedQuiz) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => setSelectedQuiz(null)}
              className="text-sm text-primary-600 hover:text-primary-700 mb-2"
            >
              &larr; Alle Quizze
            </button>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {selectedQuiz.title}
            </h1>
            <p className="text-neutral-500 mt-1">{selectedQuiz.questions.length} Fragen</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAI(true)} className="btn-secondary flex items-center gap-2">
              <Sparkles size={16} />
              KI-Generierung
            </button>
            <button
              onClick={() => {
                setCurrentQ(0);
                setAnswers({});
                setShowResult(false);
                setSelectedAnswer('');
                setAnswerRevealed(false);
                setPlayMode(true);
              }}
              className="btn-primary flex items-center gap-2"
              disabled={selectedQuiz.questions.length === 0}
            >
              <Play size={16} />
              Quiz starten
            </button>
          </div>
        </div>

        {/* Add question form */}
        {showAddQuestion ? (
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-neutral-900 dark:text-white">Neue Frage</h3>
            <div>
              <label className="label">Fragetyp</label>
              <select className="input" value={qType} onChange={(e) => setQType(e.target.value as QuestionType)}>
                <option value="multiple-choice">Multiple Choice</option>
                <option value="true-false">Wahr / Falsch</option>
                <option value="free-text">Freitext</option>
              </select>
            </div>
            <div>
              <label className="label">Frage</label>
              <textarea
                className="input min-h-[60px]"
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="Stelle deine Frage..."
              />
            </div>
            {qType === 'multiple-choice' && (
              <div>
                <label className="label">Antwortmöglichkeiten</label>
                {qOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      name="correct"
                      checked={qCorrect === opt && opt !== ''}
                      onChange={() => setQCorrect(opt)}
                      className="accent-primary-600"
                    />
                    <input
                      className="input flex-1"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...qOptions];
                        newOpts[i] = e.target.value;
                        setQOptions(newOpts);
                        if (qCorrect === opt) setQCorrect(e.target.value);
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    />
                  </div>
                ))}
              </div>
            )}
            {qType === 'true-false' && (
              <div>
                <label className="label">Richtige Antwort</label>
                <select className="input" value={qCorrect} onChange={(e) => setQCorrect(e.target.value)}>
                  <option value="">Wählen...</option>
                  <option value="Wahr">Wahr</option>
                  <option value="Falsch">Falsch</option>
                </select>
              </div>
            )}
            {qType === 'free-text' && (
              <div>
                <label className="label">Richtige Antwort</label>
                <input
                  className="input"
                  value={qCorrect}
                  onChange={(e) => setQCorrect(e.target.value)}
                  placeholder="Erwartete Antwort"
                />
              </div>
            )}
            <div>
              <label className="label">Erklärung (optional)</label>
              <textarea
                className="input"
                value={qExplanation}
                onChange={(e) => setQExplanation(e.target.value)}
                placeholder="Warum ist diese Antwort richtig?"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddQuestion} className="btn-primary">
                Hinzufügen
              </button>
              <button onClick={resetQuestionForm} className="btn-secondary">
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddQuestion(true)}
            className="card p-4 w-full text-left hover:shadow-md transition-shadow border-dashed border-2 border-neutral-300 dark:border-neutral-600 bg-transparent flex items-center gap-3 text-neutral-500 hover:text-primary-600"
          >
            <Plus size={20} />
            Neue Frage hinzufügen
          </button>
        )}

        {/* Question list */}
        <div className="space-y-3">
          {selectedQuiz.questions.map((q, i) => (
            <div key={q.id} className="card p-4">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-neutral-900 dark:text-white">{q.question}</p>
                  <p className="text-sm text-neutral-500 mt-1">
                    {q.type === 'multiple-choice' ? 'Multiple Choice' : q.type === 'true-false' ? 'Wahr/Falsch' : 'Freitext'}
                    {' '}&middot; Antwort: {q.correctAnswer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showAI && (
          <AIGenerateModal type="quiz" onGenerate={handleAIGenerated} onClose={() => setShowAI(false)} />
        )}
      </div>
    );
  }

  // Quiz list
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Quiz</h1>
          <p className="text-neutral-500 mt-1">Erstelle Quizze und teste dein Wissen</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Neues Quiz
        </button>
      </div>

      {showNew && (
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-neutral-900 dark:text-white">Neues Quiz</h3>
          <div>
            <label className="label">Titel</label>
            <input
              className="input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="z.B. Mathe Test Kapitel 5"
            />
          </div>
          <div>
            <label className="label">Beschreibung (optional)</label>
            <input
              className="input"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Kurze Beschreibung"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreateQuiz} className="btn-primary">
              Erstellen
            </button>
            <button onClick={() => setShowNew(false)} className="btn-secondary">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quizzes.map((quiz) => (
          <button
            key={quiz.id}
            onClick={() => setSelectedQuiz(quiz)}
            className="card p-5 text-left hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600 transition-colors">
                  {quiz.title}
                </h3>
                {quiz.description && <p className="text-sm text-neutral-500 mt-1">{quiz.description}</p>}
                <p className="text-xs text-neutral-400 mt-2">
                  {quiz.questions.length} Fragen &middot; {quiz.timesCompleted}x abgeschlossen
                  {quiz.averageScore > 0 && ` · ø ${Math.round(quiz.averageScore)}%`}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Quiz wirklich löschen?')) removeQuiz(quiz.id);
                }}
                className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </button>
        ))}
      </div>

      {quizzes.length === 0 && !showNew && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
            <HelpCircle size={32} className="text-purple-600" />
          </div>
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">Noch keine Quizze</h3>
          <p className="text-neutral-500 mb-4">Erstelle dein erstes Quiz!</p>
          <button onClick={() => setShowNew(true)} className="btn-primary">
            Erstes Quiz erstellen
          </button>
        </div>
      )}
    </div>
  );
}
