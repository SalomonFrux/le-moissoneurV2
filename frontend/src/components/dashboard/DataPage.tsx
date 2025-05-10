import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Download, Filter, Link as LinkIcon, Mail, Search, Edit2, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { dataService, type ScrapedEntry } from '@/services/dataService';
import axios from 'axios';

interface Company {
  id: string;
  name: string;
  sector: string;
  country: string;
  source: string;
  scraped_entries?: ScrapedEntry[];
  created_at: string;
  updated_at: string;
}

export function DataPage() {
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState<ScrapedEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ScrapedEntry>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const pageSize = 10;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await dataService.fetchAllScrapedData();
        setEntries(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredEntries = entries.filter(entry =>
    entry.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.secteur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.pays?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.adresse?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedEntries = filteredEntries.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const totalPages = Math.ceil(filteredEntries.length / pageSize);

  // Group entries by scraper name
  const groupedEntries = useMemo(() => {
    const groups: { [key: string]: ScrapedEntry[] } = {};
    filteredEntries.forEach(entry => {
      const scraperName = entry.nom || '-';
      if (!groups[scraperName]) {
        groups[scraperName] = [];
      }
      groups[scraperName].push(entry);
    });
    return groups;
  }, [filteredEntries]);

  const handleExport = () => {
    const csvData = filteredEntries.map(entry => ({
      'Nom du Scraper': entry.nom || '-',
      Secteur: entry.secteur === 'Aucune donnée' ? '-' : (entry.secteur || '-'),
      Pays: entry.pays === 'Aucune donnée' ? '-' : (entry.pays || '-'),
      'Site Web': entry.site_web === 'Aucune donnée' ? '-' : (entry.site_web || '-'),
      Email: entry.email === 'Aucune donnée' ? '-' : (entry.email || '-'),
      Téléphone: entry.telephone === 'Aucune donnée' ? '-' : (entry.telephone || '-'),
      Adresse: entry.adresse === 'Aucune donnée' ? '-' : (entry.adresse || '-'),
      'Date de création': new Date(entry.created_at).toLocaleDateString()
    }));

    // Create CSV content
    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(csvData[0]).join(",") + "\n" +
      csvData.map(row => Object.values(row).join(",")).join("\n");

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "donnees_extraites.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Export terminé", {
      description: "Les données ont été exportées au format CSV."
    });
  };

  const handleEdit = (entry: ScrapedEntry) => {
    setEditId(entry.id);
    setEditForm(entry);
  };

  const handleEditChange = (field: string, value: string) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    if (!editForm.id) return;
    
    try {
      setLoading(true);
      await dataService.updateScrapedEntry(editForm.id, editForm);
      setEntries(prev => prev.map(entry => 
        entry.id === editForm.id ? { ...entry, ...editForm } : entry
      ));
      setEditId(null);
      toast.success('Données mises à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (scraperName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scraperName)) {
        newSet.delete(scraperName);
      } else {
        newSet.add(scraperName);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold font-heading tracking-tight">Données Extraites</h2>
        <Button onClick={handleExport} disabled={loading || filteredEntries.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Exporter CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, secteur, pays, ville..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom du Scraper</TableHead>
              <TableHead>Secteur</TableHead>
              <TableHead>Pays</TableHead>
              <TableHead>Site Web</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  Chargement des données...
                </TableCell>
              </TableRow>
            ) : Object.entries(groupedEntries).length > 0 ? (
              Object.entries(groupedEntries).map(([scraperName, groupEntries]) => (
                <React.Fragment key={scraperName}>
                  <TableRow 
                    className="bg-muted/50 cursor-pointer hover:bg-muted"
                    onClick={() => toggleGroup(scraperName)}
                  >
                    <TableCell colSpan={8}>
                      <div className="flex items-center">
                        {expandedGroups.has(scraperName) ? (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-2" />
                        )}
                        <span className="font-medium">{scraperName}</span>
                        <Badge variant="secondary" className="ml-2">
                          {groupEntries.length}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedGroups.has(scraperName) && groupEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.nom || '-'}</TableCell>
                      <TableCell>{entry.secteur === 'Aucune donnée' ? '-' : (entry.secteur || '-')}</TableCell>
                      <TableCell>{entry.pays === 'Aucune donnée' ? '-' : (entry.pays || '-')}</TableCell>
                      <TableCell>
                        {entry.site_web && entry.site_web !== 'Aucune donnée' ? (
                          <a
                            href={entry.site_web.startsWith('http') ? entry.site_web : `https://${entry.site_web}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <LinkIcon className="h-4 w-4" />
                            {entry.site_web}
                          </a>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {entry.email && entry.email !== 'Aucune donnée' ? (
                          <a
                            href={`mailto:${entry.email}`}
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Mail className="h-4 w-4" />
                            {entry.email}
                          </a>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{entry.telephone === 'Aucune donnée' ? '-' : (entry.telephone || '-')}</TableCell>
                      <TableCell>{entry.adresse === 'Aucune donnée' ? '-' : (entry.adresse || '-')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(entry)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  Aucune donnée trouvée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {Object.keys(groupedEntries).length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {entries.length} entrées trouvées
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => page > 1 && setPage(page - 1)}
                  className={page === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    isActive={page === i + 1}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => page < totalPages && setPage(page + 1)}
                  className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
