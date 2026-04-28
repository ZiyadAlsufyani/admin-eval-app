export interface AcademicTerm {
  id: string;
  name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
}

export interface Holiday {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

export interface AcademicContext {
  activeTerm: AcademicTerm;
  weekNumber: number;
  isHoliday?: boolean;
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
 * Returns null only if the date falls outside of all academic terms.
 * If the date is within a term but during a holiday/break week, returns an
 * AcademicContext with `isHoliday` set to true.
 */
export function getAcademicContext(currentDate: Date, terms: AcademicTerm[], holidays: Holiday[] = []): AcademicContext | null {
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
    return null; // Outside bounds of any academic term
  }

  // Calculate the week number using Valid Sundays
  const termStartDate = new Date(activeTerm.start_date);
  const anchorDate = getSundayAnchor(termStartDate);
  const currentSunday = getSundayAnchor(compareDate);

  let weekNumber = 0;
  let isCurrentWeekHoliday = false;
  const loopDate = new Date(anchorDate);

  while (loopDate <= currentSunday) {
    // Check if loopDate falls inside any holiday
    const isHolidayWeek = holidays.some(holiday => {
      const start = new Date(holiday.start_date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(holiday.end_date);
      end.setHours(23, 59, 59, 999);
      return loopDate >= start && loopDate <= end;
    });

    if (loopDate.getTime() === currentSunday.getTime()) {
      isCurrentWeekHoliday = isHolidayWeek;
    }

    if (!isHolidayWeek) {
      weekNumber++;
    }

    // Move to next Sunday
    loopDate.setDate(loopDate.getDate() + 7);
  }

  return {
    activeTerm,
    weekNumber,
    isHoliday: isCurrentWeekHoliday
  };
}

/**
 * Generates an array of weeks for the UI selector, bounded by the active term.
 * Shows weeks from the current week down to week 1 of the term.
 */
export function getTermWeeks(activeTerm: AcademicTerm, currentWeekNumber: number, holidays: Holiday[] = []) {
  const termStart = new Date(activeTerm.start_date);
  const termAnchor = getSundayAnchor(termStart);
  
  const validWeeks = [];
  const loopDate = new Date(termAnchor);
  
  // Find all valid weeks from term start up to currentWeekNumber
  while (validWeeks.length < currentWeekNumber) {
    const isHolidayWeek = holidays.some(holiday => {
      const start = new Date(holiday.start_date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(holiday.end_date);
      end.setHours(23, 59, 59, 999);
      return loopDate >= start && loopDate <= end;
    });

    if (!isHolidayWeek) {
      const start = new Date(loopDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 4); // Thursday
      end.setHours(23, 59, 59, 999);
      
      validWeeks.push({
        start,
        end,
        label: `الأسبوع ${validWeeks.length + 1}`,
        shortFormat: `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`
      });
    }
    
    // Move to next Sunday
    loopDate.setDate(loopDate.getDate() + 7);
  }
  
  // The UI expects weeks from current down to 1
  return validWeeks.reverse();
}
