import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { type, topic, content, count = 5, difficulty = 'medium', language = 'de' } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Thema ist erforderlich' }, { status: 400 });
    }

    const difficultyLabels = { easy: 'einfach', medium: 'mittel', hard: 'schwer' };
    const diffLabel = difficultyLabels[difficulty as keyof typeof difficultyLabels] || 'mittel';

    let systemPrompt = `Du bist ein Lern-Assistent. Antworte immer in ${language === 'de' ? 'Deutsch' : 'Englisch'}. Gib nur valides JSON zurück, ohne Markdown-Codeblöcke.`;
    let userPrompt = '';

    if (type === 'flashcards') {
      userPrompt = `Erstelle ${count} Karteikarten zum Thema "${topic}" mit Schwierigkeit "${diffLabel}".
${content ? `Basierend auf diesem Inhalt:\n${content}\n` : ''}
Gib ein JSON-Objekt zurück mit folgendem Format:
{"flashcards": [{"front": "Frage", "back": "Antwort"}]}`;
    } else if (type === 'quiz') {
      userPrompt = `Erstelle ${count} Quizfragen zum Thema "${topic}" mit Schwierigkeit "${diffLabel}".
${content ? `Basierend auf diesem Inhalt:\n${content}\n` : ''}
Erstelle einen Mix aus Multiple-Choice und Wahr/Falsch-Fragen.
Gib ein JSON-Objekt zurück mit folgendem Format:
{"questions": [{"question": "Frage", "type": "multiple-choice", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "Erklärung"}]}
Für Wahr/Falsch-Fragen verwende type: "true-false" und correctAnswer: "Wahr" oder "Falsch" ohne options.`;
    } else if (type === 'summary') {
      userPrompt = `Erstelle eine verständliche Zusammenfassung zum Thema "${topic}" mit Schwierigkeit "${diffLabel}".
${content ? `Basierend auf diesem Inhalt:\n${content}\n` : ''}
Formatiere die Zusammenfassung in Markdown.
Gib ein JSON-Objekt zurück mit folgendem Format:
{"summary": "Die Zusammenfassung in Markdown"}`;
    } else if (type === 'explanation') {
      userPrompt = `Erkläre das Thema "${topic}" verständlich mit Schwierigkeit "${diffLabel}".
${content ? `Basierend auf diesem Inhalt:\n${content}\n` : ''}
Gib ein JSON-Objekt zurück mit folgendem Format:
{"explanation": "Die Erklärung in Markdown"}`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Ungültige KI-Antwort' }, { status: 500 });
    }

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: error.message || 'KI-Generierung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
