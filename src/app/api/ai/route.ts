import { NextRequest, NextResponse } from 'next/server';

function buildPrompts(type: string, topic: string, content: string, count: number, diffLabel: string, language: string) {
  const systemPrompt = `Du bist ein Lern-Assistent. Antworte immer in ${language === 'de' ? 'Deutsch' : 'Englisch'}. Gib nur valides JSON zurück, ohne Markdown-Codeblöcke.`;
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
  } else if (type === 'smart-flashcards') {
    userPrompt = `Analysiere den folgenden Lerninhalt und erstelle die optimale Anzahl an Karteikarten.

Inhalt zum Thema "${topic}":
${content}

Anweisungen:
- Lies den gesamten Text sorgfältig
- Identifiziere ALLE wichtigen Konzepte, Definitionen, Fakten und Zusammenhänge
- Erstelle für JEDES wichtige Konzept eine eigene Karteikarte
- Die Vorderseite soll eine klare Frage sein
- Die Rückseite soll eine präzise, vollständige Antwort sein
- Erstelle so viele Karten wie nötig — nicht mehr, nicht weniger
- Überspringe nichts Wichtiges, aber erstelle keine überflüssigen Karten
- Sortiere die Karten in einer logischen Reihenfolge

Gib ein JSON-Objekt zurück mit folgendem Format:
{"flashcards": [{"front": "Frage", "back": "Antwort"}], "reasoning": "Kurze Erklärung warum du diese Anzahl gewählt hast"}`;
  }

  return { systemPrompt, userPrompt };
}

function parseJSONResponse(text: string): any {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Ungültige KI-Antwort');
  return JSON.parse(jsonMatch[0]);
}

async function callAnthropic(apiKey: string, model: string, systemPrompt: string, userPrompt: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Anthropic API Fehler: ${res.status}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

async function callOpenAI(apiKey: string, model: string, systemPrompt: string, userPrompt: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4096,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI API Fehler: ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type, topic, content = '', count = 5, difficulty = 'medium', language = 'de',
      provider = 'server', apiKey = '', model = '',
    } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Thema ist erforderlich' }, { status: 400 });
    }

    const difficultyLabels: Record<string, string> = { easy: 'einfach', medium: 'mittel', hard: 'schwer' };
    const diffLabel = difficultyLabels[difficulty] || 'mittel';
    const { systemPrompt, userPrompt } = buildPrompts(type, topic, content, count, diffLabel, language);

    let responseText = '';

    if (provider === 'openai' && apiKey) {
      responseText = await callOpenAI(apiKey, model, systemPrompt, userPrompt);
    } else if (provider === 'anthropic' && apiKey) {
      responseText = await callAnthropic(apiKey, model, systemPrompt, userPrompt);
    } else {
      // Use server-side Anthropic key
      const serverKey = process.env.ANTHROPIC_API_KEY;
      if (!serverKey) {
        return NextResponse.json(
          { error: 'Kein API-Key konfiguriert. Gehe zu Profil → KI-Einstellungen und trage deinen eigenen Key ein.' },
          { status: 400 }
        );
      }
      responseText = await callAnthropic(serverKey, 'claude-sonnet-4-20250514', systemPrompt, userPrompt);
    }

    const data = parseJSONResponse(responseText);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: error.message || 'KI-Generierung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
