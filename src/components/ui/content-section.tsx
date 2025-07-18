
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ContentSectionProps {
  title: string;
  description?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  priority?: 'high' | 'medium' | 'low';
  collapsible?: boolean;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
  onExpand?: (expanded: boolean) => void;
}

export const ContentSection = ({
  title,
  description,
  badge,
  badgeVariant = 'outline',
  priority = 'medium',
  collapsible = false,
  defaultExpanded = true,
  children,
  className,
  onExpand
}: ContentSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpand?.(newExpanded);
  };

  const getPriorityStyles = () => {
    switch (priority) {
      case 'high':
        return "border-revenue-danger/20 bg-gradient-to-r from-background to-revenue-danger/5";
      case 'medium':
        return "border-revenue-warning/20 bg-gradient-to-r from-background to-revenue-warning/5";
      case 'low':
        return "border-primary/20 bg-gradient-to-r from-background to-primary/5";
      default:
        return "";
    }
  };

  return (
    <Card className={cn("shadow-soft", getPriorityStyles(), className)}>
      <CardHeader className={cn("pb-4", collapsible && "cursor-pointer")} onClick={collapsible ? handleToggle : undefined}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-h3">{title}</CardTitle>
            {badge && (
              <Badge variant={badgeVariant} className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
          
          {collapsible && (
            <Button variant="ghost" size="sm">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        
        {description && (
          <p className="text-small text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      
      {(!collapsible || isExpanded) && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
};
