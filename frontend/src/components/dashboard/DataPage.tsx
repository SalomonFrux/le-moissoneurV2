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
import { Download, Filter, Link as LinkIcon, Mail, Search, Edit2, ChevronDown, ChevronRight, Trash2, MoreVertical, FileSpreadsheet, FilePdf } from 'lucide-react';
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
  const [data, setData] = useState<Record<string, ScrapedEntry[]>>({});
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'count'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Get unique countries from entries
  const uniqueCountries = useMemo(() => {
    const countries = new Set(entries.map(entry => entry.pays).filter(Boolean));
    return Array.from(countries).sort();
  }, [entries]);

  // Filter entries by search term and country
  const filteredEntries = useMemo(() => {
    return entries.filter(entry =>
      (entry.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       entry.secteur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       entry.pays?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       entry.adresse?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!selectedCountry || selectedCountry === 'all' || entry.pays === selectedCountry)
    );
  }, [entries, searchTerm, selectedCountry]);

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

  // Handle export for a specific scraper group
  const handleExportGroup = (scraperName: string, groupEntries: ScrapedEntry[]) => {
    const csvData = groupEntries.map(entry => ({
      'Nom du Scraper': entry.nom || '-',
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
      setEntries(prev => prev.map(entry => 
        entry.id === updatedEntry.id ? updatedEntry : entry
      ));

      setEditDialogOpen(false);
      setCurrentEntry(null);
      toast.success('Données mises à jour avec succès');
    } catch (error) {
      console.error('Error updating entry:', error);
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
      setEntries(prev => prev.filter(entry => entry.id !== entryToDelete.id));
      
      toast.success('Entrée supprimée avec succès');
    } catch (error) {
      console.error('Error deleting entry:', error);
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
        <h2 className="text-3xl font-bold font-heading tracking-tight">Données Extraites</h2>
        <Button variant="default" className="bg-primary" onClick={handleExport} disabled={loading || filteredEntries.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Exporter Tout
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, secteur, pays..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  disabled={loading}
                />
              </div>
              <Select
                value={selectedCountry}
                onValueChange={(value) => {
                  setSelectedCountry(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
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
                    <TableCell colSpan={7}>
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
                    <TableCell className="text-right">
                      {expandedGroups.has(scraperName) && (
                        <Button
                          variant="default"
                          className="bg-primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportGroup(scraperName, groupEntries);
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Exporter
                        </Button>
                      )}
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
                            onClick={() => handleEditClick(entry)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(entry)}
                          >
                            <Trash2 className="h-4 w-4" />
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
              <label htmlFor="nom" className="text-right">
                Nom
              </label>
              <Input
                id="nom"
                value={currentEntry?.nom || ''}
                onChange={(e) => setCurrentEntry(prev => prev ? {...prev, nom: e.target.value} : null)}
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
