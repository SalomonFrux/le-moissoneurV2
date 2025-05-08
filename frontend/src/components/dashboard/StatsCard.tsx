
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  description?: string;
  icon?: React.ReactNode;
  trend?: number;
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  className
}: StatsCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend !== undefined) && (
          <p className="mt-2 text-xs text-muted-foreground flex items-center">
            {trend !== undefined && (
              <span
                className={cn(
                  "mr-1 inline-flex items-center rounded-md px-1 py-0.5 text-xs font-medium",
                  trend > 0
                    ? "bg-green-50 text-green-700"
                    : trend < 0
                    ? "bg-red-50 text-red-700"
                    : "bg-gray-50 text-gray-700"
                )}
              >
                {trend > 0 ? "+" : ""}
                {trend}%
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
