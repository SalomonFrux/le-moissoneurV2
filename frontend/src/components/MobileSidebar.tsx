
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from './Sidebar';

interface MobileSidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export function MobileSidebar({ activePage, setActivePage }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <Sidebar activePage={activePage} setActivePage={(page) => {
          setActivePage(page);
          setOpen(false);
        }} />
      </SheetContent>
    </Sheet>
  );
}
