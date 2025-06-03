import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CollapsibleCardProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  cardKey: string;
}

export function CollapsibleCard({
  title,
  description,
  actions,
  children,
  defaultExpanded = true,
  cardKey,
}: CollapsibleCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span>{title}</span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent 
        className={`transition-all duration-300 ${
          !isExpanded ? 'h-0 p-0 overflow-hidden' : ''
        }`}
      >
        {children}
      </CardContent>
    </Card>
  );
}
