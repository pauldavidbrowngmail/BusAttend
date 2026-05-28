import { Course } from './types';

export const COURSES: Course[] = [
  {
    id: 'BAIS 4600-001',
    prefix: 'BAIS',
    number: '4600',
    section: '001',
    title: 'Assembler Programming',
    schedule: 'MW 11:00am-11:50am',
    days: ['Monday', 'Wednesday'],
    startTime: '11:00',
    endTime: '11:50'
  },
  {
    id: 'BUS 1000-001',
    prefix: 'BUS',
    number: '1000',
    section: '001',
    title: 'Business Seminar',
    schedule: 'MW 12:00pm-12:50pm',
    days: ['Monday', 'Wednesday'],
    startTime: '12:00',
    endTime: '12:50'
  },
  {
    id: 'BUS 1950-001',
    prefix: 'BUS',
    number: '1950',
    section: '001',
    title: 'Business Software Applications',
    schedule: 'MW 1:00pm-2:15pm',
    days: ['Monday', 'Wednesday'],
    startTime: '13:00',
    endTime: '14:15'
  },
  {
    id: 'BUS 3050-001',
    prefix: 'BUS',
    number: '3050',
    section: '001',
    title: 'Survey of MIS',
    schedule: 'MW 10:00am-10:50am',
    days: ['Monday', 'Wednesday'],
    startTime: '10:00',
    endTime: '10:50'
  }
];

export const getAutoSelectedCourse = (): Course | null => {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentTime = now.getHours() * 60 + now.getMinutes();

  return COURSES.find(course => {
    if (!course.days.includes(currentDay)) return false;

    const [h, m] = course.startTime.split(':').map(Number);
    const startMins = h * 60 + m;

    const [eh, em] = course.endTime.split(':').map(Number);
    const endMins = eh * 60 + em;

    return (currentTime >= startMins - 30) && (currentTime <= endMins);
  }) || null;
};
