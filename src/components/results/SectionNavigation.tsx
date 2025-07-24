import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronUp, Navigation } from "lucide-react";

interface SectionNavigationProps {
  sections: Array<{
    id: string;
    label: string;
    readTime?: string;
  }>;
}

export const SectionNavigation = ({ sections }: SectionNavigationProps) => {
  const [activeSection, setActiveSection] = useState<string>('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll progress
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setScrollProgress(Math.min(scrollPercent, 100));

      // Show back to top button
      setShowBackToTop(scrollTop > 400);

      // Find active section
      const sectionElements = sections.map(section => 
        document.getElementById(section.id)
      ).filter(Boolean);

      let currentSection = '';
      for (const element of sectionElements) {
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            currentSection = element.id;
            break;
          }
        }
      }
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Progress Bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <Progress value={scrollProgress} className="h-1 rounded-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <Navigation className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Jump to:</span>
              <span className="text-xs font-medium sm:hidden">Sections</span>
            </div>
            <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
              {sections.map((section) => (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => scrollToSection(section.id)}
                  className="text-xs whitespace-nowrap shrink-0 px-2 sm:px-3"
                >
                  {section.label}
                  {section.readTime && (
                    <span className="ml-1 opacity-60 hidden sm:inline">({section.readTime})</span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <Button
          onClick={scrollToTop}
          size="sm"
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg"
        >
          <ChevronUp className="h-4 w-4 mr-1" />
          Top
        </Button>
      )}
    </>
  );
};