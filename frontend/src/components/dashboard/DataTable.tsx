import React from 'react';
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
import { Button } from '@/components/ui/button';
import { Download, Link } from 'lucide-react';

export interface Company {
  id: string;
  name: string;
  sector: string;
  country: string;
  website?: string;
  linkedin?: string;
  email?: string;
  source: string;
  lastUpdated: string;
}

interface DataTableProps {
  data: Company[];
  total: number;
  page: number;
  setPage: (page: number) => void;
  loading: boolean; // Added loading prop
}

export function DataTable({ data, total, page, setPage, loading }: DataTableProps) {
  const pageSize = 5;
  const totalPages = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Entreprises collectées</h3>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exporter CSV
        </Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Secteur</TableHead>
              <TableHead>Pays</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Dernière MàJ</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium">{company.name}</TableCell>
                <TableCell>{company.sector}</TableCell>
                <TableCell>{company.country}</TableCell>
                <TableCell>{company.source}</TableCell>
                <TableCell>{company.lastUpdated}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <Link className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
  );
}
