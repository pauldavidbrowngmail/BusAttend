import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Calendar, AlertCircle, BrainCircuit, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { Student, AttendanceRecord, AIInsight } from '../types';
import { analyzeAttendanceData } from '../services/geminiService';

const MOCK_CHART_DATA = [
  { name: 'Mon', attendance: 92 },
  { name: 'Tue', attendance: 88 },
  { name: 'Wed', attendance: 95 },
  { name: 'Thu', attendance: 84 },
  { name: 'Fri', attendance: 78 },
];

const MOCK_TREND_DATA = [
  { week: 'W1', rate: 85 },
  { week: 'W2', rate: 88 },
  { week: 'W3', rate: 92 },
  { week: 'W4', rate: 87 },
  { week: 'W5', rate: 90 },
  { week: 'W6', rate: 89 },
];

const StatCard: React.FC<{
  title: string; value: string; trend: string; icon: any; color: 'blue' | 'indigo' | 'emerald' | 'rose';
}> = ({ title, value, trend, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colors[color]}`}><Icon className="w-6 h-6" /></div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : trend.includes('-') ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
          {trend}
        </span>
      </div>
      <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
};

const Dashboard: React.FC<{ students: Student[]; records: AttendanceRecord[] }> = ({ students, records }) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!students || students.length === 0) { setLoadingInsights(false); return; }
    setLoadingInsights(true);
    analyzeAttendanceData(students, records)
      .then(result => { if (isMounted) setInsights(result); })
      .catch(err => console.error("Dashboard Insights Error:", err))
      .finally(() => { if (isMounted) setLoadingInsights(false); });
    return () => { isMounted = false; };
  }, [students, records]);

  const avgAttendance = students?.length > 0
    ? Math.round(students.reduce((acc, s) => acc + s.attendanceRate, 0) / students.length)
    : 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Overall Attendance" value={`${avgAttendance}%`} trend="+2.4%" icon={TrendingUp} color="blue" />
        <StatCard title="Total Students" value={(students?.length || 0).toString()} trend="Enrolled" icon={Users} color="indigo" />
        <StatCard title="Active Classes" value="12" trend="Today" icon={Calendar} color="emerald" />
        <StatCard title="Students at Risk" value="4" trend="-2 this week" icon={AlertCircle} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Daily Attendance Rate</h3>
            <select className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="attendance" radius={[4, 4, 0, 0]}>
                  {MOCK_CHART_DATA.map((_, index) => <Cell key={`cell-${index}`} fill={index === 2 ? '#2563eb' : '#cbd5e1'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6 text-blue-600">
            <BrainCircuit className="w-5 h-5" />
            <h3 className="text-lg font-bold text-slate-800">AI Engagement Insights</h3>
          </div>
          <div className="flex-1 space-y-4">
            {loadingInsights ? (
              [1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-50 rounded-xl animate-pulse"></div>)
            ) : insights.length > 0 ? (
              insights.map((insight, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${insight.riskLevel === 'high' ? 'bg-rose-50 border-rose-100' : insight.riskLevel === 'medium' ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">{insight.title}</h4>
                  <p className="text-xs text-slate-600 mb-2 leading-relaxed">{insight.description}</p>
                  <div className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                    <span>View Action Plan</span><ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">No insights available yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Weekly Trend Analysis</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MOCK_TREND_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
              <Tooltip />
              <Line type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
