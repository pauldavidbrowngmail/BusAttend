import { Student, AttendanceRecord, AIInsight } from '../types';

export const analyzeAttendanceData = async (
  students: Student[],
  records: AttendanceRecord[]
): Promise<AIInsight[]> => {
  const res = await fetch('/api/insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ students, records }),
  });
  if (!res.ok) throw new Error('Failed to fetch insights');
  return res.json();
};
