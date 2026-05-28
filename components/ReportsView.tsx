import React, { useState } from 'react';
import { Download, Mail, ChevronDown, ChevronRight, FileText, BarChart3, User, BookOpen, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { AttendanceRecord, Course } from '../types';

interface ReportsViewProps {
  records: AttendanceRecord[];
  courses: Course[];
}

const REQUIRED_PASSWORD = 'Eiusp26';

const ReportsView: React.FC<ReportsViewProps> = ({ records, courses }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => sessionStorage.getItem('bizattend_auth') === 'true');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [reportType, setReportType] = useState<'daily' | 'course-summary' | 'student-summary' | 'semester-log'>('daily');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === REQUIRED_PASSWORD) {
      setIsAuthenticated(true);
      setLoginError(false);
      sessionStorage.setItem('bizattend_auth', 'true');
    } else {
      setLoginError(true);
      setPassword('');
    }
  };

  const safeDateString = (ts: string) => {
    try { const d = new Date(ts); return isNaN(d.getTime()) ? 'Invalid Date' : d.toISOString().split('T')[0]; } catch { return 'Invalid Date'; }
  };

  const safeTimeString = (ts: string) => {
    try { const d = new Date(ts); return isNaN(d.getTime()) ? '--:--' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return '--:--'; }
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0] || {});
    const rows = [headers.join(','), ...data.map(row => headers.map(h => JSON.stringify(row[h])).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleEmail = (reportName: string) => {
    const email = prompt("Enter email address to send report:");
    if (email) alert(`Report "${reportName}" queued for delivery to ${email}`);
  };

  const isLate = (timestamp: string, courseId: string) => {
    const time = new Date(timestamp);
    if (isNaN(time.getTime())) return false;
    const course = courses.find(c => c.id === courseId);
    if (!course) return false;
    const [h, m] = course.startTime.split(':').map(Number);
    return (time.getHours() * 60 + time.getMinutes()) >= (h * 60 + m + 5);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-slate-900 p-8 text-center text-white relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-900/50">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Report Access Restricted</h3>
            <p className="text-slate-400 text-sm mt-2">Please enter your faculty credentials to view attendance records.</p>
          </div>
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Security Passcode</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoFocus
                    placeholder="••••••••"
                    className={`w-full p-4 pr-12 bg-slate-50 border rounded-2xl outline-none transition-all font-medium ${loginError ? 'border-rose-300 ring-2 ring-rose-100 bg-rose-50' : 'border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500'}`}
                  />
                  <ShieldCheck className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 ${loginError ? 'text-rose-400' : 'text-slate-300'}`} />
                </div>
                {loginError && (
                  <div className="flex items-center gap-2 mt-3 text-rose-600">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-xs font-bold">Incorrect password. Please try again.</p>
                  </div>
                )}
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-200 active:scale-[0.98]">
                Unlock Reports
              </button>
            </form>
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">School of Business Secure Link</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderDailyReport = () => {
    const filtered = records
      .filter(r => r.courseId === selectedCourseId && safeDateString(r.timestamp) === selectedDate)
      .sort((a, b) => a.studentName.localeCompare(b.studentName));

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl border border-slate-200">
          <select className="p-2 border rounded-lg" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
            {courses.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
          </select>
          <input type="date" className="p-2 border rounded-lg" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          <button disabled={filtered.length === 0} onClick={() => downloadCSV(filtered, `Daily_${selectedCourseId}_${selectedDate}`)} className="ml-auto flex items-center gap-2 text-blue-600 font-medium px-4 py-2 hover:bg-blue-50 rounded-lg disabled:opacity-50">
            <Download className="w-4 h-4" /> Download
          </button>
          <button onClick={() => handleEmail('Daily Report')} className="flex items-center gap-2 text-slate-600 font-medium px-4 py-2 hover:bg-slate-50 rounded-lg">
            <Mail className="w-4 h-4" /> Email
          </button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Student Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">E#</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Time</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(r => (
                <tr key={r.id}>
                  <td className="px-6 py-4 font-medium text-slate-800">{r.studentName}</td>
                  <td className="px-6 py-4 text-slate-600">{r.studentEId}</td>
                  <td className="px-6 py-4 text-slate-600">{safeTimeString(r.timestamp)}</td>
                  <td className="px-6 py-4">
                    {isLate(r.timestamp, r.courseId)
                      ? <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold">LATE</span>
                      : <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold">ON TIME</span>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">No scans found for this selection.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCourseSummary = () => {
    const studentsInCourse = Array.from(new Set(records.filter(r => r.courseId === selectedCourseId).map(r => r.studentEId)));
    const summary = studentsInCourse.map(eId => {
      const sr = records.filter(r => r.studentEId === eId && r.courseId === selectedCourseId);
      const lates = sr.filter(r => isLate(r.timestamp, r.courseId));
      return {
        studentName: sr[0]?.studentName || 'Unknown',
        eId,
        attended: sr.length,
        lates: lates.length,
        avgLateMins: lates.length > 0
          ? Math.round(lates.reduce((acc, curr) => {
              const t = new Date(curr.timestamp);
              if (isNaN(t.getTime())) return acc;
              const course = courses.find(c => c.id === selectedCourseId)!;
              const [h, m] = course.startTime.split(':').map(Number);
              return acc + (t.getHours() * 60 + t.getMinutes() - (h * 60 + m));
            }, 0) / lates.length) : 0,
      };
    }).sort((a, b) => a.studentName.localeCompare(b.studentName));

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl border border-slate-200">
          <select className="p-2 border rounded-lg" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
            {courses.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
          </select>
          <button disabled={summary.length === 0} onClick={() => downloadCSV(summary, `Summary_${selectedCourseId}`)} className="ml-auto flex items-center gap-2 text-blue-600 font-medium px-4 py-2 hover:bg-blue-50 rounded-lg disabled:opacity-50">
            <Download className="w-4 h-4" /> Download
          </button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Student</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Total Attended</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Late Count</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Avg Late Mins</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.map(s => (
                <tr key={s.eId}>
                  <td className="px-6 py-4"><p className="font-medium text-slate-800">{s.studentName}</p><p className="text-xs text-slate-400">{s.eId}</p></td>
                  <td className="px-6 py-4 font-semibold text-blue-600">{s.attended}</td>
                  <td className="px-6 py-4 text-amber-600">{s.lates}</td>
                  <td className="px-6 py-4 text-slate-600">{s.avgLateMins}m</td>
                </tr>
              ))}
              {summary.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">No records found for this course.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderStudentSummary = () => {
    const studentIds = Array.from(new Set(records.map(r => r.studentEId)));
    const selectedEId = selectedStudentId || studentIds[0];
    const studentRecords = records.filter(r => r.studentEId === selectedEId);
    const courseSummary = courses.map(c => ({
      ...c,
      count: studentRecords.filter(r => r.courseId === c.id).length,
      records: studentRecords.filter(r => r.courseId === c.id),
    })).filter(c => c.count > 0);

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl border border-slate-200">
          <select className="p-2 border rounded-lg" value={selectedEId} onChange={e => setSelectedStudentId(e.target.value)}>
            <option value="">-- Select Student --</option>
            {studentIds.map(id => (
              <option key={id} value={id}>{records.find(r => r.studentEId === id)?.studentName} ({id})</option>
            ))}
          </select>
        </div>
        <div className="space-y-3">
          {courseSummary.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <button onClick={() => setExpandedCourse(expandedCourse === c.id ? null : c.id)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><FileText className="w-5 h-5" /></div>
                  <div className="text-left">
                    <h4 className="font-bold text-slate-800">{c.id} - {c.title}</h4>
                    <p className="text-sm text-slate-500">Total Attended: {c.count}</p>
                  </div>
                </div>
                {expandedCourse === c.id ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
              </button>
              {expandedCourse === c.id && (
                <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100">
                  <table className="w-full text-sm mt-4">
                    <thead><tr className="text-left text-slate-500 font-semibold"><th className="pb-2">Date</th><th className="pb-2">Time</th><th className="pb-2">Status</th></tr></thead>
                    <tbody className="text-slate-700 divide-y divide-slate-200">
                      {c.records.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map(r => (
                        <tr key={r.id}>
                          <td className="py-2.5 font-medium">{new Date(r.timestamp).toLocaleDateString()}</td>
                          <td className="py-2.5">{safeTimeString(r.timestamp)}</td>
                          <td className="py-2.5">{isLate(r.timestamp, r.courseId) ? <span className="text-amber-600 font-bold">Late</span> : <span className="text-emerald-600 font-bold">On Time</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
          {courseSummary.length === 0 && <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400 font-medium">Select a student to view their history.</div>}
        </div>
      </div>
    );
  };

  const renderSemesterLog = () => {
    const sortedRecords = [...records].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl border border-slate-200 items-center">
          <div className="flex-1">
            <h3 className="text-slate-800 font-bold">Semester Master Log</h3>
            <p className="text-xs text-slate-500">All attendance records across all course sessions.</p>
          </div>
          <button disabled={sortedRecords.length === 0} onClick={() => downloadCSV(sortedRecords, `Semester_Log_${new Date().getFullYear()}`)} className="flex items-center gap-2 bg-blue-600 text-white font-bold px-6 py-2.5 hover:bg-blue-700 rounded-xl disabled:opacity-50 shadow-lg shadow-blue-100 transition-all active:scale-95">
            <Download className="w-4 h-4" /> Download Master CSV
          </button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date/Time</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Course</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">E#</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedRecords.map(r => {
                  const course = courses.find(c => c.id === r.courseId);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4"><p className="text-sm font-medium text-slate-800">{new Date(r.timestamp).toLocaleDateString()}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{safeTimeString(r.timestamp)}</p></td>
                      <td className="px-6 py-4"><p className="text-sm font-semibold text-slate-700">{r.courseId}</p><p className="text-xs text-slate-500 truncate max-w-[150px]">{course?.title || 'Unknown'}</p></td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">{r.studentName}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-mono">{r.studentEId}</td>
                      <td className="px-6 py-4">{isLate(r.timestamp, r.courseId) ? <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[10px] font-bold uppercase">LATE</span> : <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold uppercase">ON TIME</span>}</td>
                    </tr>
                  );
                })}
                {sortedRecords.length === 0 && <tr><td colSpan={5} className="px-6 py-20 text-center"><BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" /><p className="text-slate-400 font-medium">No records found.</p></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto whitespace-nowrap">
        {[
          { id: 'daily', icon: FileText, label: 'Daily Log' },
          { id: 'course-summary', icon: BarChart3, label: 'Course Summary' },
          { id: 'student-summary', icon: User, label: 'Student Summary' },
          { id: 'semester-log', icon: BookOpen, label: 'Semester Master Log' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as any)}
            className={`px-6 py-3 flex items-center gap-2 border-b-2 font-semibold transition-all ${reportType === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>
      <div>
        {reportType === 'daily' && renderDailyReport()}
        {reportType === 'course-summary' && renderCourseSummary()}
        {reportType === 'student-summary' && renderStudentSummary()}
        {reportType === 'semester-log' && renderSemesterLog()}
      </div>
    </div>
  );
};

export default ReportsView;
