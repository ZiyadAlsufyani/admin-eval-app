import { useState, useEffect } from 'react';
import type { StaffMember } from '@/types/staff';

const INITIAL_STAFF: StaffMember[] = [
  {
    id: 's1',
    name: 'سارة جنكينز', // Sarah Jenkins
    role: 'معلمة',
    subject: 'الرياضيات',
    dueDate: '12 أكتوبر 2023',
    status: 'متأخر',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7oms4e7B36QGf2yzdtVANXgdN6GGP9HO5d0t1HAnVzOHAXbB_QRR0m6z0NyR_pp4r3R5gHm_waIID2ygfp6yPbWNmh1aBVd7LZc7m1ZCDOtHBO6OFKdqECT7Eke2ZeXcsK7F8b0mAQtQb8diau3xItmTwmy3ywL2d5OwfNIrAR6iXuU_IeTwcLTtj6vmX5NXoY2WF53CUhLgWl9-oMHmxoFfm2mtaCiS3sW6dRYhlzLdauCTRjmkB85rhXkRBzRNqd7ZYEDhl5B8Q',
    metrics: {
      discipline: { id: 'discipline', name: 'الانضباط', score: 92 },
      competencies: { id: 'competencies', name: 'الجدارات', score: 88 },
    },
  },
  {
    id: 's2',
    name: 'ماركوس هولواي', // Marcus Holloway
    role: 'معلم',
    subject: 'التربية البدنية',
    dueDate: 'اليوم، 04:00 م',
    status: 'اليوم',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDenc-qcfzBbjSmZ9c6vhauLT5P92RAam4i0ITbPx5cEWv4JDe17lpODLwtD60HQtEs8of1-ehw5LRrRVmph4Fb8P-HGU5Nl9uhcBmjS2R3GDXagQSAh12PVr4szCyV1DURTtrzcF2CeI1Y8ielMTLvAYGsY_uvlAJr_VSncLnU55N_vJnOLZuPvrwRQSStt47Nga7Q1P5JwWO4VywRR08kP4Z4gqSlTdkKYBs1RcbEIWDwnGzQsMVWlXcr2y6--RcBshGs16qnJrKH',
    metrics: {
      discipline: { id: 'discipline', name: 'الانضباط', score: 85 },
      competencies: { id: 'competencies', name: 'الجدارات', score: 82 },
    },
  },
  {
    id: 's3',
    name: 'لينا أحمد', // Lina Ahmed
    role: 'معلمة',
    subject: 'العلوم العامة',
    dueDate: '15 أكتوبر 2023',
    status: 'معلق',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAVwUszqaVscpol3xzVxrbQ1E4GUnQfMQqOUJPo0CCHwJUysqCZFIBPJiVNZJ2gowjsqpru5thVzbaypOf4P0uxWh2i7bTc7pPNx_crHKCNhBk-Tj6I3zLS7x3IscgbHFAyMlIgLwYITB4wDlZ9dWaMbjOdzDogCiWtcJi7WqFW6eJW6WjWM0QoDNX0HSmD5B0FmmBeAprgQAe4anezovWiX6Jtc08IX1UGxOtclqThsQyUFjeMrl84YrItYA33RMSAJQvuZ_Y4BKL',
    metrics: {
      discipline: { id: 'discipline', name: 'الانضباط', score: 98 },
      competencies: { id: 'competencies', name: 'الجدارات', score: 95 },
    },
  },
  {
    id: 's4',
    name: 'أحمد محمود',
    role: 'وكيل شؤون الطلاب',
    subject: 'الإدارة',
    dueDate: '20 أكتوبر 2023',
    status: 'معلق',
    metrics: {
      discipline: { id: 'discipline', name: 'الانضباط', score: 85 },
      competencies: { id: 'competencies', name: 'الجدارات', score: 80 },
    },
  },
  {
    id: 's5',
    name: 'ياسر علي',
    role: 'محاسب المدرسة',
    subject: 'المالية',
    dueDate: '22 أكتوبر 2023',
    status: 'معلق',
    metrics: {
      discipline: { id: 'discipline', name: 'الانضباط', score: 95 },
      competencies: { id: 'competencies', name: 'الجدارات', score: 92 },
    },
  },
  {
    id: 's6',
    name: 'نورة إبراهيم',
    role: 'مراقبة أدوار',
    subject: 'الإشراف',
    dueDate: 'أمس، 02:00 م',
    status: 'متأخر',
    metrics: {
      discipline: { id: 'discipline', name: 'الانضباط', score: 82 },
      competencies: { id: 'competencies', name: 'الجدارات', score: 79 },
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
