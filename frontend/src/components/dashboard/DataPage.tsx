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
import { Download, Filter, Link as LinkIcon, Mail, Search, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { fetchCompanies, updateCompany } from '../../../../src/services/dataService';

export function DataPage() {
  const [page, setPage] = useState(1);
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
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

  const paginatedCompanies = filteredCompanies.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

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
                  {/* Dynamically generate sector options if needed */}
                </SelectContent>
              </Select>
              <Select disabled={loading}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  {/* Dynamically generate country options if needed */}
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
              <TableHead>Nom</TableHead>
              <TableHead>Secteur</TableHead>
              <TableHead>Pays</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Site web</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  Chargement des données...
                </TableCell>
              </TableRow>
            ) : paginatedCompanies.length > 0 ? (
              paginatedCompanies.map((company) => (
                <TableRow key={company.id}>
                  {editId === company.id ? (
                    <>
                      <TableCell>
                        <Input value={editForm.name} onChange={e => handleEditChange('name', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input value={editForm.sector} onChange={e => handleEditChange('sector', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input value={editForm.country} onChange={e => handleEditChange('country', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input value={editForm.source} onChange={e => handleEditChange('source', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input value={editForm.website} onChange={e => handleEditChange('website', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input value={editForm.email} onChange={e => handleEditChange('email', e.target.value)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={handleEditSave} disabled={loading}>Enregistrer</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditId(null)} disabled={loading}>Annuler</Button>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.sector}</TableCell>
                      <TableCell>{company.country}</TableCell>
                      <TableCell>{company.source}</TableCell>
                      <TableCell>{company.website}</TableCell>
                      <TableCell>{company.email}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" title="Modifier" onClick={() => handleEdit(company)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
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
            Affichage de {Math.min(pageSize, filteredCompanies.length)} sur {filteredCompanies.length} entreprises
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
