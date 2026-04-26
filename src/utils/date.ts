/**
 * Utility functions for date manipulation with a focus on the Saudi work week (Sunday start).
 */

/**
 * Returns the Date object representing the Sunday of the current week
 * based on the provided date.
 */
export function getStartOfWeek(date: Date = new Date()): Date {
  const result = new Date(date);
  const day = result.getDay(); // 0 is Sunday, 1 is Monday...
  // Since we want Sunday to be the start, if it's Sunday (0), difference is 0.
  // If it's Monday (1), we subtract 1 day to get to Sunday.
  const diff = result.getDate() - day;
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Generates an array of the last N weeks (including the current week).
 * Returns objects with start (Sunday) and end (Thursday) dates.
 */
export function getRecentWeeks(numWeeks: number = 5) {
  const weeks = [];
  const currentStart = getStartOfWeek();
  
  for (let i = 0; i < numWeeks; i++) {
    const start = new Date(currentStart);
    start.setDate(start.getDate() - (i * 7));
    
    // Thursday is 4 days after Sunday
    const end = new Date(start);
    end.setDate(start.getDate() + 4);
    end.setHours(23, 59, 59, 999);
    
    weeks.push({
      start,
      end,
      label: `الأسبوع ${i === 0 ? 'الحالي' : i === 1 ? 'الماضي' : 'منذ ' + i + ' أسابيع'}`,
      shortFormat: `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`
    });
  }
  
  return weeks;
}

export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
