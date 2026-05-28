export interface Course {
  id: string;
  prefix: string;
  number: string;
  section: string;
  title: string;
  schedule: string;
  days: string[];
  startTime: string;
  endTime: string;
}

export interface Student {
  id: string;
  name: string;
  attendanceRate: number;
}

export interface AIInsight {
  title: string;
  description: string;
  recommendation: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AttendanceRecord {
  id: string;
  studentEId: string;
  studentName: string;
  courseId: string;
  timestamp: string;
}

export interface ScannedQRData {
  lastName: string;
  firstName: string;
  middleInitial: string;
  eId: string;
  coursePrefixNumber: string;
}
