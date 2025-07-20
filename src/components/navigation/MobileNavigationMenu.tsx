
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";

interface NavigationSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MobileNavigationMenuProps {
  sections: NavigationSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  currentSectionLabel: string;
}

export const MobileNavigationMenu = ({
  sections,
  activeSection,
  onSectionChange,
  currentSectionLabel,
}: MobileNavigationMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSectionClick = (sectionId: string) => {
    onSectionChange(sectionId);
    setIsOpen(false); // Close menu after selection
  };

  return (
    <div className="sm:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open navigation menu</span>
          </Button>
        </SheetTrigger>
        
        <SheetContent side="right" className="w-72">
          <SheetHeader className="text-left">
            <SheetTitle className="text-lg font-semibold">
              Analysis Sections
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <Button
                  key={section.id}
                  variant={isActive ? "default" : "ghost"}
                  size="lg"
                  onClick={() => handleSectionClick(section.id)}
                  className="w-full justify-start gap-3 h-12 text-left"
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="flex-1 truncate">{section.label}</span>
                  {isActive && (
                    <Badge variant="secondary" className="text-xs">
                      Current
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
