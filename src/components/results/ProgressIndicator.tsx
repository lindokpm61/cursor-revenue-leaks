import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, X } from "lucide-react";

interface Section {
  id: string;
  label: string;
  readTime: string;
}

interface ProgressIndicatorProps {
  sections: Section[];
  className?: string;
}

export const ProgressIndicator = ({ sections, className = "" }: ProgressIndicatorProps) => {
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [viewedSections, setViewedSections] = useState<Set<string>>(new Set());
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // Calculate overall scroll progress
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min((scrollTop / docHeight) * 100, 100);
      setScrollProgress(progress);

      // Find current section
      const sectionElements = sections.map(section => 
        document.getElementById(section.id)
      ).filter(Boolean);

      let current = null;
      for (const element of sectionElements) {
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom > 100) {
            current = element.id;
            break;
          }
        }
      }

      if (current && current !== currentSection) {
        setCurrentSection(current);
        setViewedSections(prev => new Set([...prev, current]));
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections, currentSection]);

  const currentIndex = sections.findIndex(section => section.id === currentSection);
  const progressPercentage = currentIndex >= 0 ? ((currentIndex + 1) / sections.length) * 100 : 0;

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed top-20 right-6 z-40 hidden lg:flex h-8 w-8 p-0"
      >
        <Circle className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className={`fixed top-20 right-6 z-40 bg-background/95 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-lg max-w-xs hidden lg:block ${className}`}>
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Reading Progress</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              {Math.round(scrollProgress)}%
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-4 w-4 p-0 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <Progress value={scrollProgress} className="h-1" />
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-foreground mb-2">Sections</div>
        {sections.map((section, index) => {
          const isViewed = viewedSections.has(section.id);
          const isCurrent = currentSection === section.id;
          
          return (
            <div 
              key={section.id}
              className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-200 cursor-pointer hover:bg-muted/50 ${
                isCurrent ? 'bg-primary/10 border border-primary/20' : ''
              }`}
              onClick={() => {
                const element = document.getElementById(section.id);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            >
              {isViewed ? (
                <CheckCircle className="h-4 w-4 text-revenue-success flex-shrink-0" />
              ) : (
                <Circle className={`h-4 w-4 flex-shrink-0 ${
                  isCurrent ? 'text-primary' : 'text-muted-foreground'
                }`} />
              )}
              
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-medium ${
                  isCurrent ? 'text-primary' : isViewed ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {section.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {section.readTime}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-border/50">
        <div className="text-xs text-muted-foreground text-center">
          {viewedSections.size} of {sections.length} sections viewed
        </div>
      </div>
    </div>
  );
};