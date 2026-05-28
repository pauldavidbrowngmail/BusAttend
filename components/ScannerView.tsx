import React, { useEffect, useState, useRef } from 'react';
import { Camera, Pause, Play, AlertCircle, Loader2, UserCheck, ChevronDown, ChevronUp, History, User, Volume2, UserMinus } from 'lucide-react';
import { Course, AttendanceRecord, ScannedQRData } from '../types';

interface ScannerViewProps {
  course: Course;
  onScan: (record: AttendanceRecord) => Promise<{ success: boolean; isDuplicate?: boolean; message: string }>;
  recentScans: AttendanceRecord[];
}

const ScannerView: React.FC<ScannerViewProps> = ({ course, onScan, recentScans }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'duplicate' | 'idle';
    message: string;
    studentName?: string;
    studentEId?: string;
  }>({ type: 'idle', message: '' });
  const [isRecentExpanded, setIsRecentExpanded] = useState(false);

  const scannerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastScanRef = useRef<{ eid: string; time: number }>({ eid: '', time: 0 });

  const initAudio = async () => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
    } catch (e) {
      console.warn('Audio initialization failed', e);
    }
  };

  const playBeep = (freq = 1000) => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state !== 'running') return;
      const oscillator = audioCtxRef.current.createOscillator();
      const gainNode = audioCtxRef.current.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtxRef.current.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
      gainNode.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtxRef.current.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 0.12);
      oscillator.start();
      oscillator.stop(audioCtxRef.current.currentTime + 0.15);
    } catch (e) {
      console.warn('Audio beep playback failed', e);
    }
  };

  const parseQRData = (data: string): ScannedQRData | null => {
    try {
      if (!data) return null;
      const parts = data.split(';');
      if (parts.length < 2) return null;
      const namePart = parts[0].trim();
      const eId = parts[1].trim();
      const nameSplit = namePart.split(',');
      const lastName = nameSplit[0]?.trim();
      const firstMiddle = nameSplit[1]?.trim().split(' ');
      const firstName = firstMiddle?.[0]?.trim() || '';
      const middleInitial = firstMiddle?.[1]?.trim() || '';
      return { lastName, firstName, middleInitial, eId, coursePrefixNumber: parts[2]?.trim() || '' };
    } catch (e) {
      console.error("QR Parse Error", e);
      return null;
    }
  };

  const startScanner = async () => {
    if (isInitializing || isScanning) return;
    setIsInitializing(true);
    setStatus({ type: 'idle', message: '' });
    await initAudio();

    try {
      if (!(window as any).Html5Qrcode) {
        throw new Error("QR Library not loaded yet. Please wait a moment.");
      }
      const html5QrCode = new (window as any).Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          try {
            const parsed = parseQRData(decodedText);
            if (!parsed) {
              setStatus({ type: 'error', message: 'Invalid QR Code Format' });
              setTimeout(() => setStatus(p => p.type === 'error' ? { type: 'idle', message: '' } : p), 3000);
              return;
            }

            const now = Date.now();
            const normalizedEId = parsed.eId.trim().toUpperCase();
            if (lastScanRef.current.eid === normalizedEId && (now - lastScanRef.current.time) < 10000) {
              return;
            }

            const studentFullName = `${parsed.lastName}, ${parsed.firstName}${parsed.middleInitial ? ' ' + parsed.middleInitial : ''}`;
            lastScanRef.current = { eid: normalizedEId, time: now };

            const result = await onScan({
              id: Math.random().toString(36).substr(2, 9),
              studentEId: parsed.eId,
              studentName: studentFullName,
              courseId: course.id,
              timestamp: new Date().toISOString(),
            });

            if (result.success) {
              playBeep(1000);
              setStatus({ type: 'success', message: 'Attendance recorded successfully', studentName: studentFullName, studentEId: parsed.eId });
            } else if (result.isDuplicate) {
              playBeep(600);
              setStatus({ type: 'duplicate', message: 'Already checked in', studentName: studentFullName, studentEId: parsed.eId });
            } else {
              setStatus({ type: 'error', message: result.message });
            }

            setTimeout(() => {
              setStatus(prev =>
                (prev.studentEId === parsed.eId || prev.type === 'error') ? { type: 'idle', message: '' } : prev
              );
            }, 3000);
          } catch (internalErr) {
            console.error("Scanner Callback Error", internalErr);
          }
        },
        () => {}
      );
      setIsScanning(true);
    } catch (err: any) {
      setStatus({ type: 'error', message: `Scanner Error: ${err.message || 'Permission denied'}` });
      setIsScanning(false);
    } finally {
      setIsInitializing(false);
    }
  };

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      await scanner.stop();
    } catch (err: any) {
      const msg = err?.message || err?.toString() || "";
      if (!msg.includes("not running") && !msg.includes("already stopping")) {
        console.warn("Scanner Stop Warning", err);
      }
    } finally {
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        const sc = scannerRef.current;
        (async () => { try { await sc.stop(); } catch (e) {} })();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-slate-800 font-bold">Attendance Scanner</h3>
            <p className="text-xs text-slate-500">{course.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <Volume2 className={`w-3.5 h-3.5 ${isScanning ? 'text-blue-500' : 'text-slate-300'}`} />
            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${isScanning ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {isScanning ? 'System Live' : 'System Off'}
            </div>
          </div>
        </div>

        <div className="relative mb-6 rounded-2xl overflow-hidden aspect-square bg-slate-900 shadow-inner">
          <div id="reader" className="w-full h-full"></div>

          {!isScanning && !isInitializing && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white p-8 pointer-events-none">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-slate-500 font-medium">Ready to start scanning</p>
            </div>
          )}

          {isInitializing && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm text-white p-8">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-500" />
              <p className="text-slate-200 font-medium">Initializing Hardware...</p>
            </div>
          )}

          {status.type === 'success' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white p-6 text-center animate-success-flash">
              <div className="animate-text-pop flex flex-col items-center">
                <UserCheck className="w-16 h-16 mb-4" />
                <h4 className="text-2xl font-bold mb-2">Success</h4>
                <p className="text-lg font-medium mb-1">{status.studentName}</p>
                <p className="text-sm font-semibold opacity-80 mb-4 bg-white/10 px-3 py-1 rounded-full">{status.studentEId}</p>
                <p className="text-xs uppercase tracking-widest font-bold opacity-75">Attendance Recorded</p>
              </div>
            </div>
          )}

          {status.type === 'duplicate' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-amber-500 text-white p-6 text-center animate-success-flash">
              <div className="animate-text-pop flex flex-col items-center">
                <UserMinus className="w-16 h-16 mb-4 opacity-50" />
                <h4 className="text-2xl font-bold mb-2">Already Logged</h4>
                <p className="text-lg font-medium mb-1">{status.studentName}</p>
                <p className="text-sm font-semibold opacity-80 mb-4 bg-black/10 px-3 py-1 rounded-full">{status.studentEId}</p>
                <p className="text-xs uppercase tracking-widest font-bold opacity-75">Duplicate Scan Ignored</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 mb-6">
          {!isScanning ? (
            <button
              onClick={startScanner}
              disabled={isInitializing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              <Play className="w-5 h-5" /> {isInitializing ? 'Starting...' : 'Start Scanner'}
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              <Pause className="w-5 h-5" /> Pause Session
            </button>
          )}
        </div>

        {status.message && status.type === 'error' && (
          <div className="p-4 rounded-xl flex items-center gap-3 bg-rose-50 text-rose-700 border border-rose-100 mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium text-sm">{status.message}</span>
          </div>
        )}

        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <button
            onClick={() => setIsRecentExpanded(!isRecentExpanded)}
            className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-bold text-slate-700">Recent Scans ({recentScans.length})</span>
            </div>
            {isRecentExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {isRecentExpanded && (
            <div className="bg-white divide-y divide-slate-100 max-h-[200px] overflow-y-auto">
              {recentScans.length > 0 ? recentScans.map(scan => (
                <div key={scan.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-blue-50 p-1.5 rounded-lg shrink-0">
                      <User className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 truncate">{scan.studentName}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 tabular-nums shrink-0">
                    {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )) : (
                <div className="p-8 text-center">
                  <p className="text-xs text-slate-400 font-medium">No scans recorded yet in this class session.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Instructions</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Place the student's QR code in the guide box above. The system will automatically recognize it, <b>beep</b>, and show a confirmation. Duplicates within a 15-minute window are automatically ignored.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScannerView;
