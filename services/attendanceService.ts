import { AttendanceRecord } from '../types';

export const attendanceService = {
  async getAllRecords(): Promise<AttendanceRecord[]> {
    const res = await fetch('/api/records');
    if (!res.ok) throw new Error('Failed to synchronize with cloud database.');
    return res.json();
  },

  async saveRecord(record: AttendanceRecord): Promise<boolean> {
    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async resetCloudData(): Promise<void> {
    await fetch('/api/records', { method: 'DELETE' });
  },
};
