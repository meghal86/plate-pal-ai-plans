import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ResponsiveTabItem {
  value: string;
  label: string;
  icon?: LucideIcon;
  content: React.ReactNode;
  color?: string;
}

interface ResponsiveTabsProps {
  items: ResponsiveTabItem[];
  defaultValue?: string;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const ResponsiveTabs: React.FC<ResponsiveTabsProps> = ({
  items,
  defaultValue,
  className,
  orientation = 'horizontal'
}) => {
  const firstItem = items[0]?.value || '';
  const activeValue = defaultValue || firstItem;

  return (
    <Tabs defaultValue={activeValue} className={cn('space-y-6', className)} orientation={orientation}>
      {/* Mobile: Horizontal Scrollable Tabs */}
      <div className="block md:hidden">
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="inline-flex h-14 items-center space-x-1 p-1 bg-gray-100 rounded-lg min-w-max">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className={cn(
                    'flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium rounded-md transition-all duration-200 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-sm min-w-[80px] min-h-[48px]',
                    item.color && `data-[state=active]:text-${item.color}-600`
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span className="truncate">{item.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </ScrollArea>
      </div>

      {/* Tablet: Grid layout */}
      <div className="hidden md:block lg:hidden">
        <TabsList className={cn(
          'grid gap-2 h-auto p-2 bg-gray-100 rounded-lg',
          items.length <= 3 ? 'grid-cols-3' : 
          items.length <= 4 ? 'grid-cols-2' : 
          'grid-cols-3'
        )}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 h-auto text-sm font-medium rounded-md transition-all duration-200 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-sm',
                  item.color && `data-[state=active]:text-${item.color}-600`
                )}
              >
                {Icon && <Icon className="h-5 w-5" />}
                <span className="text-center">{item.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {/* Desktop: Single row */}
      <div className="hidden lg:block">
        <TabsList className={cn(
          'grid w-full gap-1 p-1 bg-gray-100 rounded-lg',
          `grid-cols-${items.length}`
        )}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-sm',
                  item.color && `data-[state=active]:text-${item.color}-600`
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {/* Tab Contents */}
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value} className="space-y-6">
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default ResponsiveTabs;