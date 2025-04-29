
import { ReactNode } from 'react';

interface PageTitleProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export const PageTitle = ({ title, description, icon }: PageTitleProps) => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        {icon && <div className="w-8 h-8 flex items-center justify-center">{icon}</div>}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      {description && (
        <p className="text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
};
