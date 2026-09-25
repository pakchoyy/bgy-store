'use client';

import { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

const TabsContext = createContext();

export function Tabs({ defaultValue, value, onValueChange, children, className }) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : activeTab;
  const setCurrent = isControlled ? onValueChange : setActiveTab;

  return (
    <TabsContext.Provider value={{ current, setCurrent }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ value, children, className, ...props }) {
  const { current, setCurrent } = useContext(TabsContext);
  return (
    <button
      role="tab"
      onClick={() => setCurrent(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300',
        current === value
          ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-slate-50'
          : 'hover:text-slate-700 dark:hover:text-slate-300',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, ...props }) {
  const { current } = useContext(TabsContext);
  if (current !== value) return null;
  return (
    <div
      role="tabpanel"
      className={cn(
        'mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300',
        className
      )}
      {...props}
    />
  );
}
