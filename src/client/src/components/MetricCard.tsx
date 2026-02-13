import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricItem {
  label: string;
  value: number | string;
  unit?: string;
}

interface MetricCardProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  metrics: MetricItem[];
  className?: string;
}

/**
 * MetricCard - Display nutrition metrics with icon
 *
 * Features:
 * - Icon with customizable color
 * - Multiple metric items (e.g., Food, Exercise, Remaining)
 * - Soft shadow and rounded corners
 * - Light background matching reference design
 */
export default function MetricCard({
  title,
  icon: Icon,
  iconColor,
  metrics,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-blue-50 dark:bg-blue-950/30 p-3 shadow-sm',
        className
      )}
    >
      {/* Title with Icon */}
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('h-4 w-4', iconColor)} />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>

      {/* Metrics Grid */}
      <div className="flex justify-between items-end">
        {metrics.map((metric, index) => (
          <div key={index} className="flex flex-col">
            <span className="text-xl font-bold text-foreground">
              {metric.value}
              {metric.unit && (
                <span className="text-sm font-normal text-muted-foreground">
                  {metric.unit}
                </span>
              )}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {metric.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
