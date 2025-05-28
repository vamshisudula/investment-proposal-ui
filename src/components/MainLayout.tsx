
import { ReactNode, useState, useEffect } from 'react';
import { SidebarNavigation } from './SidebarNavigation';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if screen is mobile on initial load
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check initially
    checkIsMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return (
    <div className="min-h-screen flex w-full">
      <SidebarNavigation isMobile={isMobile} />
      <main className={`${isMobile ? 'ml-0 w-full' : 'ml-[280px] w-[calc(100%-280px)]'} p-4 md:p-6 transition-all duration-300`}>
        {children}
      </main>
    </div>
  );
};
