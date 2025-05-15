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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Download, Filter, Link as LinkIcon, Mail, Search, Edit2, ChevronDown, ChevronRight, Trash2, MoreVertical, FileSpreadsheet, FileText, Calendar, Globe, Building2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { dataService, type ScrapedEntry } from '@/services/dataService';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [entries, setEntries] = useState<{scraper_name: string, entries: ScrapedEntry[]}[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ScrapedEntry>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const pageSize = 10;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<ScrapedEntry | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<ScrapedEntry | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'count'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedSort, setSelectedSort] = useState<'name' | 'date' | 'count'>('name');
  const [selectedCountFilter, setSelectedCountFilter] = useState<string>('all');
  // Get unique countries from all entries
  const uniqueCountries = useMemo(() => {
    const countries = new Set(entries.flatMap(group => 
      group.entries.map(entry => entry.pays)
    ).filter(Boolean));
    return Array.from(countries).sort();
  }, [entries]);

  // Filter entries by search term and country
  const filteredGroups = useMemo(() => {
    return entries.map(group => ({
      scraper_name: group.scraper_name,
      entries: group.entries.filter(entry =>
        (entry.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         entry.secteur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         entry.pays?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         entry.adresse?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (!selectedCountry || selectedCountry === 'all' || entry.pays === selectedCountry)
      )
    })).filter(group => group.entries.length > 0);
  }, [entries, searchTerm, selectedCountry]);


  const sortedGroups = useMemo(() => {
    return filteredGroups.sort((a, b) => {
      if (sortBy === 'name') {
        return a.scraper_name.localeCompare(b.scraper_name);
      } else if (sortBy === 'date') {
        const latestA = a.entries[0]?.created_at || '';
        const latestB = b.entries[0]?.created_at || '';
        return new Date(latestB).getTime() - new Date(latestA).getTime(); // Sort by latest date first
      } else if (sortBy === 'count') {
        return b.entries.length - a.entries.length; // Sort by count descending
      }
      return 0; // Default case
    });
  }, [filteredGroups, sortBy]);


  // Add this helper function near the top of the component
  const escapeCSVValue = (value: string): string => {
    if (!value) return '';
    // Replace any double quotes with two double quotes (CSV escape sequence)
    value = value.replace(/"/g, '""');
    // If the value contains commas, quotes, or newlines, wrap it in quotes
    if (/[",\n]/.test(value)) {
      value = `"${value}"`;
    }
    return value;
  };

  // Handle export for a pecific scraper group
  const handleExportGroup = (scraperName: string, groupEntries: ScrapedEntry[]) => {
    const csvData = groupEntries.map(entry => ({
      'Nom de la compagnie': entry.nom || '-',
      Secteur: entry.secteur === 'Aucune donnée' ? '-' : (entry.secteur || '-'),
      Pays: entry.pays === 'Aucune donnée' ? '-' : (entry.pays || '-'),
      'Site Web': entry.site_web === 'Aucune donnée' ? '-' : (entry.site_web || '-'),
      Email: entry.email === 'Aucune donnée' ? '-' : (entry.email || '-'),
      Téléphone: entry.telephone === 'Aucune donnée' ? '-' : (entry.telephone || '-'),
      Adresse: entry.adresse === 'Aucune donnée' ? '-' : (entry.adresse || '-'),
      'Date de création': new Date(entry.created_at).toLocaleDateString()
    }));

    // Create CSV content with proper escaping
    const headers = Object.keys(csvData[0]);
    const csvContent = "data:text/csv;charset=utf-8," + 
      headers.map(header => escapeCSVValue(header)).join(",") + "\n" +
      csvData.map(row => 
        headers.map(header => escapeCSVValue(row[header])).join(",")
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${scraperName}_donnees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Export terminé", {
      description: `Les données de ${scraperName} ont été exportées au format CSV.`
    });
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await dataService.fetchAllScrapedData();
        // The response is already grouped by scraper name from the backend
        setEntries(response);
      } catch (error) {
      //  console.error('Error fetching data:', error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const paginatedEntries = filteredGroups.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const totalPages = Math.ceil(filteredGroups.length / pageSize);

  const CHUNK_SIZE = 100000; // Number of rows per chunk

  const handleCsvExport = async () => {
    try {
      // Flatten the grouped data for export
      const allData = entries.flatMap(group => group.entries);
      const totalChunks = Math.ceil(allData.length / CHUNK_SIZE);
      
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min((i + 1) * CHUNK_SIZE, allData.length);
        const chunk = allData.slice(start, end);
        
        const csvContent = convertToCSV(chunk);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `export-part${i + 1}-${new Date().toISOString()}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        
        // Add delay between chunks to prevent browser overload
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      toast.success(`Export completed in ${totalChunks} parts`);
    } catch (error) {
     // console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const convertToCSV = (data: any[]) => {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );
    return [headers, ...rows].join('\n');
  };

  const handleExportPdf = async () => {
    try {
      setLoading(true);
      const blob = await dataService.exportToPdf();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `export-${new Date().toISOString()}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      //console.error('Error exporting to PDF:', error);
      toast("Failed to export PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: ScrapedEntry) => {
    setEditId(entry.id);
    setEditForm(entry);
  };

  const handleEditChange = (field: string, value: string) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    if (!currentEntry) return;

    try {
      setLoading(true);
      const updatedEntry = await dataService.updateScrapedEntry(currentEntry.id, {
        nom: currentEntry.nom,
        secteur: currentEntry.secteur,
        pays: currentEntry.pays,
        site_web: currentEntry.site_web,
        email: currentEntry.email,
        telephone: currentEntry.telephone,
        adresse: currentEntry.adresse
      });
      
      // Update the entries state with the edited entry
      setEntries(prev => prev.map(group => ({
        ...group,
        entries: group.entries.map(entry => 
          entry.id === updatedEntry.id ? updatedEntry : entry
        )
      })));

      setEditDialogOpen(false);
      setCurrentEntry(null);
      toast.success('Données mises à jour avec succès');
    } catch (error) {
      //console.error('Error updating entry:', error);
      toast.error('Erreur lors de la mise à jour des données');
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

  const handleEditClick = (entry: ScrapedEntry) => {
    setCurrentEntry({ ...entry });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (entry: ScrapedEntry) => {
    setEntryToDelete(entry);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;

    try {
      setLoading(true);
      await dataService.deleteScrapedEntry(entryToDelete.id);
      
      // Remove the deleted entry from the state
      setEntries(prev => prev.map(group => ({
        ...group,
        entries: group.entries.filter(e => e.id !== entryToDelete.id)
      })));
      
      toast.success('Entrée supprimée avec succès');
    } catch (error) {
     // console.error('Error deleting entry:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
      setEntryToDelete(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Données Extraites</h2>
          <p className="text-muted-foreground">
            Gérez et explorez les données collectées par vos scrapers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCsvExport} disabled={loading}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
        
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  disabled={loading}
                />
              </div>
              <Select
                value={selectedCountry}
                onValueChange={setSelectedCountry}
                disabled={loading}
              >
                     
                <SelectTrigger className="w-[180px]">
                  <Globe className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtrer par pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  {uniqueCountries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={sortBy}
                onValueChange={(value: 'name' | 'date' | 'count') => setSortBy(value)}
                disabled={loading}
              >
                <SelectTrigger className="w-[180px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nom</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="count">Nombre d'entrées</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-[calc(100vh-300px)]">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Chargement des données...</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-4">
                {filteredGroups.map((group) => (
                  <Card key={group.scraper_name} className="overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleGroup(group.scraper_name)}
                    >
                      <div className="flex items-center gap-4">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold">{group.scraper_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {group.entries.length} entrées collectées
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {group.entries[0]?.pays || 'Pays inconnu'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportGroup(group.scraper_name, group.entries);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {expandedGroups.has(group.scraper_name) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                    
                    {expandedGroups.has(group.scraper_name) && (
                      <div className="border-t">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nom De L'Entreprise</TableHead>
                              <TableHead>Secteur</TableHead>
                              <TableHead>Pays</TableHead>
                              <TableHead>Numero</TableHead>
                              <TableHead>Mail & Site Web</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.entries.map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell className="font-medium">
                                  {entry.nom || '-'}
                                </TableCell>
                                <TableCell>{entry.secteur || '-'}</TableCell>
                                <TableCell>{entry.pays || '-'}</TableCell>
                                <TableCell>{entry.telephone || '-'}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-4">
                                 
                                    {entry.email && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <a href={`mailto:${entry.email}`} className="flex items-center gap-2 text-blue-500 hover:underline">
                                              <Mail className="h-4 w-4" />
                                              <span className="truncate max-w-[200px]">{entry.email}</span>
                                            </a>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{entry.email}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    {entry.site_web && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <a 
                                              href={entry.site_web} 
                                              target="_blank" 
                                              rel="noopener noreferrer" 
                                              className="flex items-center gap-2 text-blue-500 hover:underline"
                                            >
                                              <LinkIcon className="h-4 w-4" />
                                              <span className="truncate max-w-[200px]"></span>
                                            </a>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{entry.site_web}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {new Date(entry.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditClick(entry)}>
                                        <Edit2 className="mr-2 h-4 w-4" />
                                        Modifier
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        className="text-red-600"
                                        onClick={() => handleDeleteClick(entry)}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Supprimer
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier l'entrée</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'entrée ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="company_name" className="text-right">
                Nom de l'Entreprise
              </label>
              <Input
                id="company_name"
                value={currentEntry?.company_name || ''}
                onChange={(e) => setCurrentEntry(prev => prev ? {...prev, company_name: e.target.value} : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="secteur" className="text-right">
                Secteur
              </label>
              <Input
                id="secteur"
                value={currentEntry?.secteur || ''}
                onChange={(e) => setCurrentEntry(prev => prev ? {...prev, secteur: e.target.value} : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="pays" className="text-right">
                Pays
              </label>
              <Input
                id="pays"
                value={currentEntry?.pays || ''}
                onChange={(e) => setCurrentEntry(prev => prev ? {...prev, pays: e.target.value} : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="site_web" className="text-right">
                Site Web
              </label>
              <Input
                id="site_web"
                value={currentEntry?.site_web || ''}
                onChange={(e) => setCurrentEntry(prev => prev ? {...prev, site_web: e.target.value} : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email" className="text-right">
                Email
              </label>
              <Input
                id="email"
                value={currentEntry?.email || ''}
                onChange={(e) => setCurrentEntry(prev => prev ? {...prev, email: e.target.value} : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="telephone" className="text-right">
                Téléphone
              </label>
              <Input
                id="telephone"
                value={currentEntry?.telephone || ''}
                onChange={(e) => setCurrentEntry(prev => prev ? {...prev, telephone: e.target.value} : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="adresse" className="text-right">
                Adresse
              </label>
              <Input
                id="adresse"
                value={currentEntry?.adresse || ''}
                onChange={(e) => setCurrentEntry(prev => prev ? {...prev, adresse: e.target.value} : null)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditSave} disabled={loading}>
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cette entrée sera définitivement supprimée de la base de données.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
