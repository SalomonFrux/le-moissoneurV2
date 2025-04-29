import { useState } from 'react';
import { ScrapedData } from '../../services/dataService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Trash, ExternalLink, Eye } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface DataTableProps {
  data: ScrapedData[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export function DataTable({ data, loading, onDelete }: DataTableProps) {
  const [selectedData, setSelectedData] = useState<ScrapedData | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const truncateText = (text: string | undefined, maxLength = 50) => {
    if (!text) return 'N/A';
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Scraped At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                <TableCell><Skeleton className="h-8 w-[100px]" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 border rounded-md">
        <h3 className="text-lg font-medium">No data found</h3>
        <p className="text-muted-foreground mt-2">
          Run your scrapers to collect data
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Scraped At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{truncateText(item.title)}</TableCell>
                <TableCell>{truncateText(item.content)}</TableCell>
                <TableCell>
                  {item.url ? (
                    <div className="flex items-center">
                      <span className="mr-2">{truncateText(item.url, 30)}</span>
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {formatDate(item.scraped_at)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedData(item)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmDelete(item.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View Data Dialog */}
      {selectedData && (
        <Dialog open={!!selectedData} onOpenChange={() => setSelectedData(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedData.title || 'Data Details'}</DialogTitle>
              <DialogDescription>
                Scraped at {formatDate(selectedData.scraped_at)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {selectedData.url && (
                <div>
                  <h4 className="text-sm font-medium mb-1">URL</h4>
                  <div className="flex items-center">
                    <p className="text-sm break-all">{selectedData.url}</p>
                    <a
                      href={selectedData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              )}
              
              {selectedData.content && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Content</h4>
                  <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm">
                    {selectedData.content}
                  </div>
                </div>
              )}
              
              {selectedData.metadata && Object.keys(selectedData.metadata).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Metadata</h4>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(selectedData.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button onClick={() => setSelectedData(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Delete Dialog */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this data? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDelete) {
                  onDelete(confirmDelete);
                  setConfirmDelete(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}