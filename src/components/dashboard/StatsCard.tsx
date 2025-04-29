import { ReactNode } from 'react';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon?: ReactNode;
  delta?: string;
  loading?: boolean;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  delta,
  loading = false,
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center">
            {icon && <div className="mr-2 text-muted-foreground">{icon}</div>}
            <div className="font-medium">{title}</div>
          </div>
        </div>
        <div className="mt-4">
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-3xl font-bold">{value}</div>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            {loading ? <Skeleton className="h-3 w-32" /> : description}
          </div>
          {delta && !loading && (
            <div className="text-xs text-muted-foreground mt-1">
              {delta}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}