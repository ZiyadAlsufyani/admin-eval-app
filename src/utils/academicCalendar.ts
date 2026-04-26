export interface AcademicTerm {
  id: string;
  name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
}

export interface AcademicContext {
  activeTerm: AcademicTerm;
  weekNumber: number;
}

/**
 * Calculates the difference in days between two dates.
 */
function daysBetween(startDate: Date, endDate: Date): number {
  const oneDay = 1000 * 60 * 60 * 24;
  const start = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return Math.floor((end - start) / oneDay);
}

/**
 * Finds the Sunday of the week containing the given date.
 */
export function getSundayAnchor(date: Date): Date {
  const anchor = new Date(date);
  const day = anchor.getDay(); // 0 is Sunday
  anchor.setDate(anchor.getDate() - day);
  anchor.setHours(0, 0, 0, 0);
  return anchor;
}

/**
 * Engine to determine the active term and week number based on a given date.
 * Returns null if the date falls outside of any active term (holiday/break).
 */
export function getAcademicContext(currentDate: Date, terms: AcademicTerm[]): AcademicContext | null {
  // Reset time part for accurate date comparison
  const compareDate = new Date(currentDate);
  compareDate.setHours(0, 0, 0, 0);

  // Find if the current date falls within any term
  const activeTerm = terms.find(term => {
    const start = new Date(term.start_date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(term.end_date);
    end.setHours(23, 59, 59, 999);
    
    return compareDate >= start && compareDate <= end;
  });

  if (!activeTerm) {
    return null; // Holiday or outside bounds
  }

  // Calculate the week number using Sunday Anchor
  const termStartDate = new Date(activeTerm.start_date);
  const anchorDate = getSundayAnchor(termStartDate);
  const currentSunday = getSundayAnchor(compareDate);

  const daysDiff = daysBetween(anchorDate, currentSunday);
  const weekNumber = Math.floor(daysDiff / 7) + 1;

  return {
    activeTerm,
    weekNumber
  };
}

/**
 * Generates an array of weeks for the UI selector, bounded by the active term.
 * Shows weeks from the current week down to week 1 of the term.
 */
export function getTermWeeks(activeTerm: AcademicTerm, currentWeekNumber: number) {
  const weeks = [];
  const termStart = new Date(activeTerm.start_date);
  const termAnchor = getSundayAnchor(termStart);
  
  for (let i = 0; i < currentWeekNumber; i++) {
    const start = new Date(termAnchor);
    // (currentWeekNumber - 1 - i) goes from (current - 1) down to 0
    start.setDate(start.getDate() + ((currentWeekNumber - 1 - i) * 7));
    
    const end = new Date(start);
    end.setDate(start.getDate() + 4); // Thursday
    end.setHours(23, 59, 59, 999);
    
    weeks.push({
      start,
      end,
      label: `الأسبوع ${currentWeekNumber - i}`,
      shortFormat: `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`
    });
  }
  return weeks;
}
