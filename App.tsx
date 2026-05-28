import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ScannerView from './components/ScannerView';
import ReportsView from './components/ReportsView';
import Dashboard from './components/Dashboard';
import { AttendanceRecord, Course, Student } from './types';
import { COURSES, getAutoSelectedCourse } from './constants';
import { attendanceService } from './services/attendanceService';
import { Loader2, CloudOff } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(getAutoSelectedCourse());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    attendanceService.getAllRecords()
      .then(setRecords)
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const studentMap = new Map<string, { name: string; records: number }>();
    records.forEach(r => {
      const existing = studentMap.get(r.studentEId) || { name: r.studentName, records: 0 };
      studentMap.set(r.studentEId, { ...existing, records: existing.records + 1 });
    });
    setStudents(
      Array.from(studentMap.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        attendanceRate: Math.min(100, Math.round((data.records / 15) * 100)),
      }))
    );
  }, [records]);

  const addRecord = async (record: AttendanceRecord) => {
    const now = new Date(record.timestamp);
    const normalizedEId = record.studentEId.trim().toUpperCase();
    const normalizedCourseId = record.courseId.trim().toUpperCase();

    const isDuplicate = records.some(r => {
      const rTime = new Date(r.timestamp);
      const timeDiff = Math.abs(now.getTime() - rTime.getTime()) / 60000;
      return (
        r.studentEId.trim().toUpperCase() === normalizedEId &&
        r.courseId.trim().toUpperCase() === normalizedCourseId &&
        now.toDateString() === rTime.toDateString() &&
        timeDiff < 15
      );
    });

    if (isDuplicate) {
      return { success: false, isDuplicate: true, message: 'Student already recorded for this session (15m window).' };
    }

    setRecords(prev => [...prev, record]);

    setIsSyncing(true);
    const success = await attendanceService.saveRecord(record);
    setIsSyncing(false);

    if (!success) {
      return { success: false, isDuplicate: false, message: 'Cloud sync failed. Data kept locally.' };
    }
    return { success: true, isDuplicate: false, message: 'Attendance recorded and synced.' };
  };

  const getRecentScans = () => {
    if (!selectedCourse) return [];
    return records
      .filter(r => r.courseId === selectedCourse.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <h2 className="text-slate-800 font-bold text-xl">BusAttend</h2>
        <p className="text-slate-500 font-medium">Synchronizing records with cloud...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <CloudOff className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-slate-800 font-bold text-xl mb-2">Sync Connection Error</h2>
        <p className="text-slate-500 mb-6 max-w-md">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold">Retry Connection</button>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} isSyncing={isSyncing}>
      {activeTab === 'attendance' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <label className="block text-sm font-bold text-slate-700 mb-3">Target Course Session</label>
            <select
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer font-bold text-slate-900"
              value={selectedCourse?.id || ''}
              onChange={e => setSelectedCourse(COURSES.find(c => c.id === e.target.value) || null)}
            >
              <option value="">-- Select or change course --</option>
              {COURSES.map(course => (
                <option key={course.id} value={course.id}>
                  {course.id} • {course.title} • {course.schedule}
                </option>
              ))}
            </select>
          </div>

          {selectedCourse ? (
            <ScannerView course={selectedCourse} onScan={addRecord} recentScans={getRecentScans()} />
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
              <p className="text-slate-400 font-medium">Please select a course to initialize the camera scanner.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && <ReportsView records={records} courses={COURSES} />}
      {activeTab === 'dashboard' && <Dashboard students={students} records={records} />}

      {activeTab === 'settings' && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
          <h3 className="text-xl font-bold text-slate-800 mb-2">System Settings</h3>
          <p className="text-slate-500 mb-8">Management of API keys, device preferences, and cloud configuration.</p>
          <button
            onClick={async () => {
              if (confirm('Are you sure? This will delete all attendance data from the database.')) {
                await attendanceService.resetCloudData();
                setRecords([]);
              }
            }}
            className="bg-rose-50 text-rose-600 px-6 py-3 rounded-xl font-bold hover:bg-rose-100 transition-colors"
          >
            Clear All Records
          </button>
        </div>
      )}
    </Layout>
  );
};

export default App;
