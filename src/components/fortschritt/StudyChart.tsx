'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { StudySession } from '@/types';

interface Props {
  sessions: StudySession[];
}

export function StudyChart({ sessions }: Props) {
  const chartData = useMemo(() => {
    const days: Record<string, { date: string; label: string; minuten: number; karten: number }> = {};

    // Last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' });
      days[key] = { date: key, label, minuten: 0, karten: 0 };
    }

    for (const s of sessions) {
      const key = s.date.split('T')[0];
      if (days[key]) {
        days[key].minuten += s.duration;
        days[key].karten += s.cardsStudied || 0;
      }
    }

    return Object.values(days);
  }, [sessions]);

  const hasData = chartData.some((d) => d.minuten > 0 || d.karten > 0);

  if (!hasData) {
    return (
      <div className="card p-8 text-center">
        <p className="text-neutral-400 text-sm">
          Noch keine Lerndaten. Starte eine Flashcard- oder Quiz-Session!
        </p>
      </div>
    );
  }

  return (
    <div className="card p-4 sm:p-6">
      <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Letzte 14 Tage</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#a3a3a3' }}
            axisLine={{ stroke: '#e5e5e5' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#a3a3a3' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #e5e5e5',
              borderRadius: '0.75rem',
              fontSize: '13px',
            }}
            formatter={(value: number, name: string) => [
              value,
              name === 'minuten' ? 'Minuten' : 'Karten',
            ]}
            labelFormatter={(label) => label}
          />
          <Legend
            formatter={(value) => (value === 'minuten' ? 'Minuten' : 'Karten')}
            wrapperStyle={{ fontSize: '12px' }}
          />
          <Bar dataKey="minuten" fill="#5c7cfa" radius={[4, 4, 0, 0]} />
          <Bar dataKey="karten" fill="#40c057" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
