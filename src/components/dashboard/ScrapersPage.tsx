import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScraperCard } from './ScraperCard';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useToast } from '../../hooks/use-toast';
import { Scraper, getScrapers, createScraper, deleteScraper } from '../../services/scraperService';

export function ScrapersPage() {
  const [scrapers, setScrapers] = useState<Scraper[]>([]);
  const [loading, setLoading] = useState(true);
  const [newScraper, setNewScraper] = useState({
    name: '',
    description: '',
    url: '',
    type: 'generic', // Default to generic scraper
    status: 'inactive' as const,
  });
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadScrapers();
  }, []);

  const loadScrapers = async () => {
    try {
      setLoading(true);
      const data = await getScrapers();
      setScrapers(data);
    } catch (error) {
      console.error('Failed to load scrapers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scrapers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScraper = async () => {
    try {
      if (!newScraper.name) {
        toast({
          title: 'Validation Error',
          description: 'Scraper name is required',
          variant: 'destructive',
        });
        return;
      }
      
      if (!newScraper.url) {
        toast({
          title: 'Validation Error',
          description: 'Target URL is required',
          variant: 'destructive',
        });
        return;
      }
      
      const created = await createScraper(newScraper);
      setScrapers([created, ...scrapers]);
      setNewScraper({
        name: '',
        description: '',
        url: '',
        type: 'generic',
        status: 'inactive',
      });
      setOpen(false);
      
      toast({
        title: 'Success',
        description: 'Scraper created successfully',
      });
    } catch (error) {
      console.error('Failed to create scraper:', error);
      toast({
        title: 'Error',
        description: 'Failed to create scraper',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteScraper = async (id: string) => {
    try {
      await deleteScraper(id);
      setScrapers(scrapers.filter(scraper => scraper.id !== id));
      toast({
        title: 'Success',
        description: 'Scraper deleted successfully',
      });
    } catch (error) {
      console.error(`Failed to delete scraper ${id}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to delete scraper',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Scrapers</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add New Scraper</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new scraper</DialogTitle>
              <DialogDescription>
                Add details for your new web scraper
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newScraper.name}
                  onChange={(e) => setNewScraper({ ...newScraper, name: e.target.value })}
                  placeholder="E.g., News Scraper"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Target URL</Label>
                <Input
                  id="url"
                  value={newScraper.url}
                  onChange={(e) => setNewScraper({ ...newScraper, url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Scraper Type</Label>
                <Select
                  value={newScraper.type}
                  onValueChange={(value) => setNewScraper({ ...newScraper, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a scraper type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generic">Generic</SelectItem>
                    <SelectItem value="news">News Portal</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs mt-1">
                  {newScraper.type === 'generic' 
                    ? 'Extracts general content from any webpage'
                    : 'Specialized for news portals with article extraction'}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newScraper.description}
                  onChange={(e) => setNewScraper({ ...newScraper, description: e.target.value })}
                  placeholder="Describe what this scraper does"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateScraper}>Create Scraper</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-48 bg-gray-100 dark:bg-gray-800 rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          {scrapers.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No scrapers found</h3>
              <p className="text-muted-foreground mt-2">
                Create your first scraper to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scrapers.map((scraper) => (
                <ScraperCard 
                  key={scraper.id} 
                  scraper={scraper} 
                  onDelete={() => handleDeleteScraper(scraper.id)} 
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}