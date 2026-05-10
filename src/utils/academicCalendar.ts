export interface FiscalYear {
  id: string;
  year_label: string;
  start_date: string;
  end_date: string;
}

export interface Holiday {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

export interface FiscalContext {
  activeFiscalYear: FiscalYear;
  currentMonth: number;
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
 * Generates an array of valid Saudi workweeks within a target month and year.
 * Strict Sunday Anchor Rule: A week belongs strictly to the month containing its starting Sunday.
 */
export function getMonthWeeks(targetMonth: number, targetYear: number, holidays: Holiday[] = []) {
  const validWeeks = [];
  
  // Start from the first day of the target month
  const monthStart = new Date(targetYear, targetMonth, 1);
  monthStart.setHours(0, 0, 0, 0);
  
  // Find the first Sunday strictly inside this month.
  let loopDate = new Date(monthStart);
  if (loopDate.getDay() !== 0) {
    loopDate.setDate(loopDate.getDate() + (7 - loopDate.getDay()));
  }

  // End boundary: the last day of the month
  const monthEnd = new Date(targetYear, targetMonth + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  // Collect weeks where the Sunday is within the target month
  while (loopDate <= monthEnd) {
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
  
  // The UI expects weeks from newest to oldest
  return validWeeks.reverse();
}

/**
 * Engine to determine the active fiscal year, month, and week number based on a given date.
 * Returns null only if the date falls outside of all fiscal years.
 */
export function getFiscalContext(currentDate: Date, fiscalYears: FiscalYear[], holidays: Holiday[] = []): FiscalContext | null {
  const compareDate = new Date(currentDate);
  compareDate.setHours(0, 0, 0, 0);

  const activeFiscalYear = fiscalYears.find(fy => {
    const start = new Date(fy.start_date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(fy.end_date);
    end.setHours(23, 59, 59, 999);
    
    return compareDate >= start && compareDate <= end;
  });

  if (!activeFiscalYear) {
    return null; // Outside bounds of any fiscal year
  }

  // Calculate the week number using Valid Sundays
  const currentSunday = getSundayAnchor(compareDate);

  // Strict Sunday Anchor: the logical month is determined by the Sunday of the current week
  const targetMonth = currentSunday.getMonth();
  const targetYear = currentSunday.getFullYear();

  const isCurrentWeekHoliday = holidays.some(holiday => {
    const start = new Date(holiday.start_date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(holiday.end_date);
    end.setHours(23, 59, 59, 999);
    return currentSunday >= start && currentSunday <= end;
  });

  const monthWeeks = getMonthWeeks(targetMonth, targetYear, holidays);
  
  let weekNumber = 0;
  const matchedWeek = monthWeeks.find(w => w.start.getTime() === currentSunday.getTime());
  
  if (matchedWeek) {
    const match = matchedWeek.label.match(/\d+/);
    if (match) {
      weekNumber = parseInt(match[0], 10);
    }
  } else if (!isCurrentWeekHoliday) {
    // Edge case fallback if it wasn't matched but isn't a holiday 
    // (should not happen with Strict Sunday Anchor)
    weekNumber = 1;
  }

  return {
    activeFiscalYear,
    currentMonth: targetMonth + 1, // 1-12 range
    weekNumber,
    isHoliday: isCurrentWeekHoliday
  };
}
