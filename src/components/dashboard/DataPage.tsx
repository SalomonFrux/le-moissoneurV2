import { React, useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import { ScrapedData, getAllData, deleteScrapedData } from '../../services/dataService';
import { DataTable } from './DataTable';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search } from 'lucide-react';

export function DataPage() {
  const [data, setData] = useState<ScrapedData[]>([]);
  const [filteredData, setFilteredData] = useState<ScrapedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredData(data);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = data.filter(item => 
        (item.title?.toLowerCase().includes(query) || 
         item.content?.toLowerCase().includes(query) || 
         item.url?.toLowerCase().includes(query))
      );
      setFilteredData(filtered);
    }
  }, [searchQuery, data]);

  const loadData = async () => {
    try {
      setLoading(true);
      const fetchedData = await getAllData();
      setData(fetchedData);
      setFilteredData(fetchedData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scraped data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteScrapedData(id);
      setData(data.filter(item => item.id !== id));
      toast({
        title: 'Success',
        description: 'Data deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete data:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete data',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold">Scraped Data</h2>
        
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={handleRefresh}>Refresh</Button>
        </div>
      </div>

      <DataTable 
        data={filteredData} 
        loading={loading} 
        onDelete={handleDelete} 
      />
    </div>
  );
}