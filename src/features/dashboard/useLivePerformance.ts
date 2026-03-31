import { useState, useEffect } from 'react';
import type { StaffMember } from '@/types/staff';

const INITIAL_STAFF: StaffMember[] = [
  {
    id: 's1',
    name: 'أحمد محمود',
    role: 'وكيل شؤون الطلاب',
    metrics: {
      discipline: { id: 'discipline', name: 'الانضباط', score: 92 },
      competencies: { id: 'competencies', name: 'الجدارات', score: 88 },
    },
  },
  {
    id: 's2',
    name: 'محمد عبدالله',
    role: 'مشرف إداري',
    metrics: {
      discipline: { id: 'discipline', name: 'الانضباط', score: 75 },
      competencies: { id: 'competencies', name: 'الجدارات', score: 82 },
    },
  },
  {
    id: 's3',
    name: 'سارة خالد',
    role: 'مرشدة طلابية',
    metrics: {
      discipline: { id: 'discipline', name: 'الانضباط', score: 98 },
      competencies: { id: 'competencies', name: 'الجدارات', score: 95 },
    },
  },
  {
    id: 's4',
    name: 'عمر فهد',
    role: 'مسؤول القبول والتسجيل',
    metrics: {
      discipline: { id: 'discipline', name: 'الانضباط', score: 85 },
      competencies: { id: 'competencies', name: 'الجدارات', score: 80 },
    },
  },
  {
    id: 's5',
    name: 'منى عبدالرحمن',
    role: 'أمينة مكتبة',
    metrics: {
      discipline: { id: 'discipline', name: 'الانضباط', score: 90 },
      competencies: { id: 'competencies', name: 'الجدارات', score: 89 },
    },
  },
  {
    id: 's6',
    name: 'ياسر علي',
    role: 'محاسب المدرسة',
    metrics: {
      discipline: { id: 'discipline', name: 'الانضباط', score: 95 },
      competencies: { id: 'competencies', name: 'الجدارات', score: 92 },
    },
  },
  {
    id: 's7',
    name: 'نورة إبراهيم',
    role: 'مراقبة أدوار',
    metrics: {
      discipline: { id: 'discipline', name: 'الانضباط', score: 82 },
      competencies: { id: 'competencies', name: 'الجدارات', score: 79 },
    },
  },
  {
    id: 's8',
    name: 'خالد عبدالعزيز',
    role: 'أمين مستودع',
    metrics: {
      discipline: { id: 'discipline', name: 'الانضباط', score: 88 },
      competencies: { id: 'competencies', name: 'الجدارات', score: 84 },
    },
  },
];

export function useLivePerformance() {
  const [staffList, setStaffList] = useState<StaffMember[]>(INITIAL_STAFF);

  useEffect(() => {
    // Simulate real-time data updates every 4 seconds
    const intervalId = setInterval(() => {
      setStaffList((currentList) =>
        currentList.map((staff) => {
          // Randomly decide if this person's score will change in this tick (30% chance)
          const willChange = Math.random() > 0.7;
          if (!willChange) return staff;

          // Copy current metrics
          const newMetrics = { ...staff.metrics };
          
          Object.keys(newMetrics).forEach((metricKey) => {
            // Random fluctuation between -3 and +3
            const fluctuation = Math.floor(Math.random() * 7) - 3;
            let currentScore = newMetrics[metricKey].score;
            let newScore = currentScore + fluctuation;
            
            // Keep scores bound between 0 and 100
            if (newScore > 100) newScore = 100;
            if (newScore < 0) newScore = 0;

            newMetrics[metricKey] = {
              ...newMetrics[metricKey],
              score: newScore,
            };
          });

          return { ...staff, metrics: newMetrics };
        })
      );
    }, 4000);

    return () => clearInterval(intervalId);
  }, []);

  return { staffList };
}
