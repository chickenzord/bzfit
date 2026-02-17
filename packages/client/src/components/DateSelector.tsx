import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

/**
 * DateSelector - Horizontal week view with pill-style date buttons
 *
 * Features:
 * - Shows current week (7 days centered on selected date)
 * - Pill-style buttons with mint green highlight for selected date
 * - Navigation arrows to move between weeks
 * - Mobile-friendly horizontal scroll
 */
export default function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate array of 7 days centered around selected date
  const getWeekDates = (centerDate: Date): Date[] => {
    const dates: Date[] = [];
    const startOfWeek = new Date(centerDate);
    startOfWeek.setDate(centerDate.getDate() - 3); // Go back 3 days

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(selectedDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 7);
    onDateChange(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 7);
    onDateChange(newDate);
  };

  return (
    <div className="flex items-center gap-1 py-2">
      {/* Previous Week Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePreviousWeek}
        className="h-9 w-9 shrink-0"
        aria-label="Previous week"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Week Days - Horizontal Scroll */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide flex-1">
        {weekDates.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          const dayName = weekDays[date.getDay()];
          const dayNumber = date.getDate();

          return (
            <button
              key={index}
              onClick={() => onDateChange(date)}
              className={cn(
                'flex flex-col items-center justify-center rounded-full px-2.5 py-1.5 min-w-[48px] transition-colors shrink-0',
                'hover:bg-accent/50',
                isSelected && 'bg-emerald-100 dark:bg-emerald-900/30',
                isToday && !isSelected && 'bg-emerald-50 dark:bg-emerald-900/20'
              )}
              aria-label={`Select ${dayName} ${dayNumber}`}
            >
              <span className="text-[10px] font-medium text-muted-foreground">
                {dayName}
              </span>
              <span
                className={cn(
                  'text-base font-semibold mt-0.5',
                  isSelected && 'text-foreground',
                  !isSelected && 'text-muted-foreground'
                )}
              >
                {dayNumber}
              </span>
            </button>
          );
        })}
      </div>

      {/* Next Week Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNextWeek}
        className="h-9 w-9 shrink-0"
        aria-label="Next week"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
