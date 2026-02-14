import React, { useState } from 'react';
import { Flame, PieChart, Bookmark, Image as ImageIcon, Camera } from 'lucide-react';
import DateSelector from '@/components/DateSelector';
import MetricCard from '@/components/MetricCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * JournalPage - Daily meal journal with date selector and nutrition metrics
 *
 * Features:
 * - Horizontal week date selector
 * - Calorie tracking card (Food, Exercise, Remaining)
 * - Macros tracking card (Carbs, Protein, Fat)
 * - Quick meal logging input
 * - Chronological view of daily logs
 * - Matches reference design (ui_meal_dashboard.jpeg)
 */
export default function JournalPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [mealInput, setMealInput] = useState('');

  // TODO: Replace with real data from API
  const calorieData = {
    food: 0,
    exercise: 0,
    remaining: 1500,
  };

  const macroData = {
    carbs: { current: 0, target: 188 },
    protein: { current: 0, target: 94 },
    fat: { current: 0, target: 42 },
  };

  const handleQuickLog = () => {
    // TODO: Implement quick meal logging
    console.log('Logging meal:', mealInput);
    setMealInput('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Date Selector */}
      <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Calories Card */}
        <MetricCard
          title="Calories"
          icon={Flame}
          iconColor="text-orange-500"
          metrics={[
            { label: 'Food', value: calorieData.food },
            { label: 'Exercise', value: calorieData.exercise },
            { label: 'Remaining', value: calorieData.remaining },
          ]}
        />

        {/* Macros Card */}
        <MetricCard
          title="Macros"
          icon={PieChart}
          iconColor="text-pink-500"
          metrics={[
            {
              label: 'Carbs (g)',
              value: `${macroData.carbs.current}/${macroData.carbs.target}`,
            },
            {
              label: 'Protein (g)',
              value: `${macroData.protein.current}/${macroData.protein.target}`,
            },
            {
              label: 'Fat (g)',
              value: `${macroData.fat.current}/${macroData.fat.target}`,
            },
          ]}
        />
      </div>

      {/* Meals List Placeholder */}
      <div className="mt-8 space-y-4">
        <div className="text-center py-12 text-muted-foreground">
          <p>No meals logged yet</p>
          <p className="text-sm mt-2">Start by adding what you ate below</p>
        </div>
      </div>

      {/* Quick Meal Input - Fixed to Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 md:relative md:border-0 md:p-0 md:mt-8">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Input
            type="text"
            placeholder="What did you eat or exercise?"
            value={mealInput}
            onChange={(e) => setMealInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickLog()}
            className="flex-1 h-12 rounded-full px-4"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 shrink-0"
            aria-label="Add bookmark"
          >
            <Bookmark className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 shrink-0"
            aria-label="Add image"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 shrink-0"
            aria-label="Take photo"
          >
            <Camera className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
