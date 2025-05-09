import React, { useState, useEffect } from 'react';
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
import { fetchCompanies, updateCompany } from '../../../../src/services/dataService';

export function DataPage() {
  const [page, setPage] = useState(1);
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [expandedScrapers, setExpandedScrapers] = useState<Set<string>>(new Set());
  const pageSize = 5;

  useEffect(() => {
    async function fetchCompaniesData() {
      setLoading(true);
      try {
        const data = await fetchCompanies();
        setCompanies(data);
      } catch (error) {
        toast.error("Erreur lors du chargement des entreprises");
      } finally {
        setLoading(false);
      }
    }
    fetchCompaniesData();
  }, []);

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group companies by name
  const groupedCompanies = filteredCompanies.reduce((acc, company) => {
    const companyName = company.name;
    if (!acc[companyName]) {
      acc[companyName] = [];
    }
    acc[companyName].push(company);
    return acc;
  }, {} as Record<string, any[]>);

  const totalPages = Math.ceil(filteredCompanies.length / pageSize);

  const handleExport = () => {
    toast.success("Export lancé", {
      description: "Les données sont en cours d'exportation au format CSV."
    });
  };

  const handleEdit = (company: any) => {
    setEditId(company.id);
    setEditForm({ ...company });
  };

  const handleEditChange = (field: string, value: string) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    try {
      setLoading(true);
      await updateCompany(editForm);
      setCompanies((prev) => prev.map((c) => (c.id === editForm.id ? { ...editForm } : c)));
      setEditId(null);
      toast.success('Entreprise mise à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const toggleScraper = (scraperName: string) => {
    setExpandedScrapers(prev => {
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
        <h2 className="text-3xl font-bold font-heading tracking-tight">Données</h2>
        <Button onClick={handleExport} disabled={loading}>
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
                  placeholder="Rechercher par nom, secteur, pays..."
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
            <div className="flex flex-wrap items-center gap-2">
              <Select disabled={loading}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Secteur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les secteurs</SelectItem>
                </SelectContent>
              </Select>
              <Select disabled={loading}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pays</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" disabled={loading}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Secteur</TableHead>
              <TableHead>Pays</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Site web</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4 text-muted-foreground">
                  Chargement des données...
                </TableCell>
              </TableRow>
            ) : Object.entries(groupedCompanies).length > 0 ? (
              (Object.entries(groupedCompanies) as [string, any[]][]).map(([companyName, companies]) => (
                <React.Fragment key={companyName}>
                  <TableRow className="bg-muted/50">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleScraper(companyName)}
                        className="h-8 w-8"
                      >
                        {expandedScrapers.has(companyName) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell colSpan={9} className="font-medium">
                      {companyName} ({companies[0].scraped_entries?.length || 0} entrées)
                    </TableCell>
                  </TableRow>
                  {expandedScrapers.has(companyName) && companies[0].scraped_entries?.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell></TableCell>
                      <TableCell className="font-medium">{companyName}</TableCell>
                      <TableCell>{companies[0].sector}</TableCell>
                      <TableCell>{companies[0].country}</TableCell>
                      <TableCell>{entry.url}</TableCell>
                      <TableCell>
                        {entry.metadata?.website && (
                          <a 
                            href={entry.metadata.website.startsWith('http') ? entry.metadata.website : `http://${entry.metadata.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <LinkIcon className="h-4 w-4" />
                            {entry.metadata.website}
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.metadata?.email && (
                          <a 
                            href={`mailto:${entry.metadata.email}`}
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Mail className="h-4 w-4" />
                            {entry.metadata.email}
                          </a>
                        )}
                      </TableCell>
                      <TableCell>{entry.metadata?.phone}</TableCell>
                      <TableCell>{entry.metadata?.address}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" title="Modifier" onClick={() => handleEdit(companies[0])}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4 text-muted-foreground">
                  Aucun résultat trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {filteredCompanies.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Affichage de {filteredCompanies.length} entreprises
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
