
import { ReactNode } from 'react';
import { SidebarNavigation } from './SidebarNavigation';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen flex w-full">
      <SidebarNavigation />
      <main className="ml-[280px] w-[calc(100%-280px)] p-6">
        {children}
      </main>
    </div>
  );
};
