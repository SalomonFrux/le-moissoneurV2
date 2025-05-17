import React, { useState } from 'react';
import { ScrapedEntry } from '../../services/dataService';
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
import { Trash, ExternalLink, Eye, Edit } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface DataTableProps {
  data: ScrapedEntry[];
  loading: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  scraperId?: string;
}

export function DataTable({ data, loading, onDelete, onEdit, scraperId }: DataTableProps) {
  const [selectedData, setSelectedData] = useState<ScrapedEntry | null>(null);
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
              <TableHead>Nom</TableHead>
              <TableHead>Secteur</TableHead>
              <TableHead>Pays</TableHead>
              <TableHead>Site Web</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                <TableCell><Skeleton className="h-8 w-[100px]" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 border rounded-md">
        <h3 className="text-lg font-medium">Aucune donnée trouvée</h3>
        <p className="text-muted-foreground mt-2">
          Lancez vos scrapers pour collecter des données
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
              <TableHead>Nom</TableHead>
              <TableHead>Secteur</TableHead>
              <TableHead>Pays</TableHead>
              <TableHead>Site Web</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{truncateText(item.nom?.toLowerCase())}</TableCell>
                <TableCell>{truncateText(item.secteur)}</TableCell>
                <TableCell>{item.pays}</TableCell>
                <TableCell>
                  {item.site_web ? (
                    <div className="flex items-center">
                      <span className="mr-2">{truncateText(item.site_web, 30)}</span>
                      <a 
                        href={item.site_web} 
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
                  {item.email ? (
                    <a 
                      href={`mailto:${item.email}`}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      {item.email}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell>{item.telephone || 'N/A'}</TableCell>
                <TableCell>{truncateText(item.adresse, 40) || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {formatDate(item.created_at)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedData(item)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(item.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmDelete(item.id)}
                      >
                        <Trash className="h-4 w-4" />
                  </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedData} onOpenChange={() => setSelectedData(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedData?.nom || 'Détails'}</DialogTitle>
            <DialogDescription>
              Créé le {selectedData && formatDate(selectedData.created_at)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Nom</h4>
                <p className="text-sm">{selectedData?.nom || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Secteur</h4>
                <p className="text-sm">{selectedData?.secteur || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Pays</h4>
                <p className="text-sm">{selectedData?.pays || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Site Web</h4>
                {selectedData?.site_web ? (
                  <a
                    href={selectedData.site_web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:text-blue-700 flex items-center gap-1"
              >
                    {selectedData.site_web}
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <p className="text-sm">N/A</p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Email</h4>
                {selectedData?.email ? (
                  <a
                    href={`mailto:${selectedData.email}`}
                    className="text-sm text-blue-500 hover:text-blue-700"
                  >
                    {selectedData.email}
                  </a>
                ) : (
                  <p className="text-sm">N/A</p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Téléphone</h4>
                <p className="text-sm">{selectedData?.telephone || 'N/A'}</p>
              </div>
            </div>
            
            {selectedData?.adresse && (
              <div>
                <h4 className="text-sm font-medium mb-1">Adresse</h4>
                <p className="text-sm whitespace-pre-wrap">{selectedData.adresse}</p>
              </div>
            )}
            
            {selectedData?.metadata && Object.keys(selectedData.metadata).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Métadonnées</h4>
                <div className="bg-muted p-4 rounded-md">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(selectedData.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
    </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedData(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette entrée ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(null)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDelete && onDelete) {
                  onDelete(confirmDelete);
                  setConfirmDelete(null);
                }
              }}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
