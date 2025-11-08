import { addDays, isWeekend } from "date-fns";

/**
 * Adiciona dias úteis a uma data, pulando sábados e domingos
 */
export function addBusinessDays(date: Date, daysToAdd: number): Date {
  let currentDate = new Date(date);
  let daysAdded = 0;

  while (daysAdded < daysToAdd) {
    currentDate = addDays(currentDate, 1);
    
    // Pula finais de semana
    if (!isWeekend(currentDate)) {
      daysAdded++;
    }
  }

  return currentDate;
}
