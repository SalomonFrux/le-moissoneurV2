import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Code, Save, RefreshCw, Search, Filter, MoreVertical, Globe, Mail, LinkIcon } from 'lucide-react';
import { ScraperCard } from './ScraperCard';
import type { ScraperData } from './ScraperCard';
import { toast } from 'sonner';
import { getAllScrapers, runScraper, getScraperStatus, createScraper, deleteScraper, updateScraper } from '@/services/scraperService';
import { dataService } from '@/services/dataService';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo, Democratic Republic of the", "Congo, Republic of the", "Costa Rica", "Cote d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

interface ScraperConfig {
  name: string;
  source: string;
  selector: string;
  paginationSelector: string;
  dropdownClickSelector?: string;
  childSelectors?: string;
  engine: 'playwright' | 'puppeteer';
  frequency: 'daily' | 'weekly' | 'monthly' | 'manual';
  country?: string;
  twoPhaseScraping: string;
  phase1Selectors: {
    name: string;
    dropdownTrigger?: string;
  };
  phase2Selectors: {
    name: string;
    phone: string;
    email: string;
    website: string;
    address: string;
  };
}

export function ScrapersPage() {
  const [scrapers, setScrapers] = useState<ScraperData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const formRef = React.useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<ScraperConfig>({
    name: '',
    source: '',
    selector: '',
    paginationSelector: '',
    dropdownClickSelector: '',
    childSelectors: '',
    engine: 'playwright',
    frequency: 'manual',
    country: '',
    twoPhaseScraping: 'false',
    phase1Selectors: {
      name: '',
      dropdownTrigger: ''
    },
    phase2Selectors: {
      name: '',
      phone: '',
      email: '',
      website: '',
      address: ''
    }
  });
  const [expandedScrapers, setExpandedScrapers] = useState<Set<string>>(new Set());
  const [scrapedData, setScrapedData] = useState<Record<string, any[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [editingScraperId, setEditingScraperId] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedFrequency, setSelectedFrequency] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedScraperId, setSelectedScraperId] = useState<string | null>(null);

  useEffect(() => {
    fetchScrapers();
  }, []);

  const fetchScrapers = async () => {
    try {
      setIsRefreshing(true);
      const data = await getAllScrapers();
      // Transform and sort data to show newest first
      const transformedData: ScraperData[] = data
        .map(scraper => ({
          ...scraper,
          dataCount: scraper.data_count || 0,
          type: scraper.type || 'playwright',
          selectors: {
            main: scraper.selectors?.main || '',
            pagination: scraper.selectors?.pagination,
            dropdownClick: scraper.selectors?.dropdownClick,
            child: scraper.selectors?.child,
            name: scraper.selectors?.name || '',
            email: scraper.selectors?.email || '',
            phone: scraper.selectors?.phone || '',
            address: scraper.selectors?.address || '',
            website: scraper.selectors?.website || '',
            sector: scraper.selectors?.sector || ''
          }
        }))
        .sort((a, b) => {
          const dateA = a.last_run && !isNaN(new Date(a.last_run).getTime()) ? new Date(a.last_run).getTime() : 0;
          const dateB = b.last_run && !isNaN(new Date(b.last_run).getTime()) ? new Date(b.last_run).getTime() : 0;
          return dateB - dateA; // Sort by newest first
        });
      setScrapers(transformedData);
    } catch (error) {
      toast.error('Failed to fetch scrapers');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('phase1.')) {
      const subField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        phase1Selectors: {
          ...prev.phase1Selectors,
          [subField]: value
        }
      }));
    } else if (field.startsWith('phase2.')) {
      const subField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        phase2Selectors: {
          ...prev.phase2Selectors,
          [subField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.source) {
      toast.error('Le nom et l\'URL de la source sont requis');
      return;
    }

    try {
      setLoading(true);
      
      // If editing, first fetch the current scraper data
      let existingSelectors = {};
      if (editingScraperId) {
        const currentScraper = scrapers.find(s => s.id === editingScraperId);
        existingSelectors = currentScraper?.selectors || {};
      }

      // Prepare the selectors object
      const newSelectors: ScraperData['selectors'] = {
        main: formData.selector || '',
        pagination: formData.paginationSelector || '',
        dropdownClick: formData.dropdownClickSelector || '',
        child: formData.childSelectors ? JSON.parse(formData.childSelectors) : {},
        name: formData.phase2Selectors.name || '',
        email: formData.phase2Selectors.email || '',
        phone: formData.phase2Selectors.phone || '',
        address: formData.phase2Selectors.address || '',
        website: formData.phase2Selectors.website || '',
        sector: ''
      };

      const scraperData = {
        name: formData.name,
        source: formData.source,
        selectors: newSelectors,
        frequency: formData.frequency,
        status: 'idle' as const,
        type: formData.engine,
        country: formData.country || 'Unknown',
        dataCount: 0
      };

      if (editingScraperId) {
        await updateScraper(editingScraperId, scraperData);
        toast.success('Scraper mis à jour avec succès');
      } else {
        await createScraper(scraperData);
        toast.success('Scraper créé avec succès');
      }

      await fetchScrapers();
      setFormData({
        name: '',
        source: '',
        selector: '',
        paginationSelector: '',
        dropdownClickSelector: '',
        childSelectors: '',
        engine: 'playwright',
        frequency: 'manual',
        country: '',
        twoPhaseScraping: 'false',
        phase1Selectors: {
          name: '',
          dropdownTrigger: ''
        },
        phase2Selectors: {
          name: '',
          phone: '',
          email: '',
          website: '',
          address: ''
        }
      });
      setEditingScraperId(null);
      setShowForm(false);
    } catch (error) {
     // console.error('Error submitting scraper:', error);
      toast.error(editingScraperId ? 'Erreur lors de la mise à jour du scraper' : 'Erreur lors de la création du scraper');
    } finally {
      setLoading(false);
    }
  };

  const handleEditScraper = (scraper: ScraperData) => {
    setEditingScraperId(scraper.id);
    setFormData({
      name: scraper.name,
      source: scraper.source,
      selector: scraper.selectors?.main || '',
      paginationSelector: scraper.selectors?.pagination || '',
      dropdownClickSelector: scraper.selectors?.dropdownClick || '',
      childSelectors: scraper.selectors?.child ? JSON.stringify(scraper.selectors.child) : '',
      engine: scraper.type,
      frequency: scraper.frequency,
      country: scraper.country || '',
      twoPhaseScraping: 'false',
      phase1Selectors: { name: '', dropdownTrigger: '' },
      phase2Selectors: { name: '', phone: '', email: '', website: '', address: '' }
    });
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleNewScraper = () => {
    setEditingScraperId(null);
    setFormData({
      name: '',
      source: '',
      selector: '',
      paginationSelector: '',
      dropdownClickSelector: '',
      childSelectors: '',
      engine: 'playwright',
      frequency: 'manual',
      country: '',
      twoPhaseScraping: 'false',
      phase1Selectors: { name: '', dropdownTrigger: '' },
      phase2Selectors: { name: '', phone: '', email: '', website: '', address: '' }
    });
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({ name: '', source: '', selector: '', paginationSelector: '', dropdownClickSelector: '', childSelectors: '', engine: 'playwright', frequency: 'manual', country: '', twoPhaseScraping: 'false', phase1Selectors: { name: '', dropdownTrigger: '' }, phase2Selectors: { name: '', phone: '', email: '', website: '', address: '' } });
  };

  const handleDeleteScraper = async (id: string) => {
    try {
      setLoading(true);
      await deleteScraper(id);
      setScrapers(prev => prev.filter(scraper => scraper.id !== id));
      toast.success('Scraper supprimé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la suppression du scraper');
    } finally {
      setLoading(false);
    }
  };

  const handleRunScraper = async (id: string) => {
    try {
      setLoading(true);
      await runScraper(id);
      const updatedScraper = await getScraperStatus(id);
     // console.log('Updated scraper data:', updatedScraper);
      
      // Update scrapers with the new data from the database
      await fetchScrapers(); // Refresh all scrapers to get updated lastRun
      
      // Fetch the scraped data for this scraper
      const scrapedData = await dataService.fetchScrapedData(id);
      console.log('Scraped data length:', scrapedData.length);
      toast.success(`${scrapedData.length} entrées collectées`);
    } catch (error) {
     // console.error('Error running scraper:', error);
      toast.error('Erreur lors du lancement du scraper');
    } finally {
      setLoading(false);
    }
  };

  const handleStopScraper = (id: string) => {
    setScrapers((prev) =>
      prev.map((scraper) =>
        scraper.id === id ? { ...scraper, status: 'idle' as const } : scraper
      )
    );
    
    toast.info(`Scraper ${scrapers.find(s => s.id === id)?.name} arrêté`, {
      description: "L'opération a été interrompue."
    });
  };
  
  const handleViewData = async (id: string) => {
    try {
      setLoading(true);
      const data = await dataService.fetchScrapedData(id);
      setSelectedScraperId(id);
      setScrapedData({ [id]: data }); // Only keep the current scraper's data
      
      // Scroll to the data table after a short delay to ensure it's rendered
      setTimeout(() => {
        const tableElement = document.querySelector('[data-scraper-table]');
        if (tableElement) {
          tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Filter and paginate scrapers
  const filteredScrapers = scrapers.filter(scraper => {
    const matchesSearch = scraper.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         scraper.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = selectedCountry === 'all' || scraper.country === selectedCountry;
    const matchesStatus = selectedStatus === 'all' || scraper.status === selectedStatus;
    const matchesFrequency = selectedFrequency === 'all' || scraper.frequency === selectedFrequency;
    
    return matchesSearch && matchesCountry && matchesStatus && matchesFrequency;
  });

  // Sort scrapers
  const sortedScrapers = [...filteredScrapers].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = a.last_run ? new Date(a.last_run).getTime() : 0;
      const dateB = b.last_run ? new Date(b.last_run).getTime() : 0;
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    }
    
    const aValue = sortBy === 'name' ? a.name : a.status;
    const bValue = sortBy === 'name' ? b.name : b.status;
    return sortOrder === 'asc' ? 
      aValue.localeCompare(bValue) : 
      bValue.localeCompare(aValue);
  });

  // Calculate pagination
  const totalItems = sortedScrapers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedScrapers = sortedScrapers.slice(startIndex, endIndex);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Jamais';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Jamais';
      
      const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
      const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${months[date.getMonth()]}/${date.getFullYear()}`;
      
      // Format time
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const formattedTime = `${hours}:${minutes}`;
      
      return `${formattedDate} ${formattedTime}`;
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Jamais';
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-3xl font-bold font-heading tracking-tight">Scrapers</h2>
          <Button 
            variant="outline" 
            size="icon"
            onClick={fetchScrapers}
            className={cn(
              "ml-2 transition-transform duration-200",
              isRefreshing && "animate-spin"
            )}
            disabled={isRefreshing}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={handleNewScraper}>
          <Plus className="mr-2 h-4 w-4" /> Nouveau Scraper
        </Button>
      </div>
      
      <Card className="p-4">
        <div className="space-y-4">
          {/* Filters section */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un scraper..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-[180px]">
                <Globe className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrer par pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les pays</SelectItem>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="idle">Inactif</SelectItem>
                <SelectItem value="running">En cours</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="error">Erreur</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedFrequency} onValueChange={setSelectedFrequency}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par fréquence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les fréquences</SelectItem>
                <SelectItem value="manual">Manuel</SelectItem>
                <SelectItem value="daily">Quotidien</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scrapers grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedScrapers.map((scraper) => (
              <ScraperCard
                key={scraper.id}
                scraper={scraper}
                onRunScraper={handleRunScraper}
                onStopScraper={handleStopScraper}
                onViewData={handleViewData}
                onEditScraper={(scraper) => {
                  handleEditScraper(scraper);
                  setShowForm(true);
                }}
                onDeleteScraper={handleDeleteScraper}
                showEditOptions={true}
                showViewData={true}
              />
            ))}
          </div>

          {/* Display scraped data with animation */}
          {selectedScraperId && Object.entries(scrapedData).map(([scraperId, entries]) => {
            const scraper = scrapers.find(s => s.id === scraperId);
            if (!scraper) return null;

            return (
              <Card 
                key={scraperId} 
                className="mt-4 animate-fadeIn"
                data-scraper-table
              >
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Données de {scraper.name}</CardTitle>
                    <CardDescription>{entries.length} entrées collectées</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedScraperId(null);
                      setScrapedData({});
                    }}
                  >
                    Fermer
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead>Adresse</TableHead>
                          <TableHead>Site Web</TableHead>
                          <TableHead>Secteur</TableHead>
                          <TableHead>Date de collecte</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="font-medium">{entry.nom || '-'}</TableCell>
                            <TableCell>
                              {entry.email ? (
                                <a href={`mailto:${entry.email}`} className="text-blue-500 hover:underline flex items-center gap-1">
                                  <Mail className="h-4 w-4" />
                                  {entry.email}
                                </a>
                              ) : '-'}
                            </TableCell>
                            <TableCell>{entry.telephone || '-'}</TableCell>
                            <TableCell>{entry.adresse || '-'}</TableCell>
                            <TableCell>
                              {entry.website ? (
                                <a href={entry.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                                  <LinkIcon className="h-4 w-4" />
                                  {entry.website}
                                </a>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{entry.secteur || '-'}</TableCell>
                            <TableCell>{formatDate(entry.created_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Pagination */}
          {totalItems > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  Affichage de {startIndex + 1} à {endIndex} sur {totalItems} scrapers
                </p>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 50, 100].map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {showForm && (
        <Card ref={formRef}>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Créer un nouveau scraper</CardTitle>
              <CardDescription>
                Configurez un nouveau scraper pour collecter des données d'une source en ligne.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Nom du scraper</label>
                  <Input 
                    id="name" 
                    placeholder="Ex: FADEV Scraper" 
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="source" className="text-sm font-medium">URL de la source</label>
                  <Input 
                    id="source" 
                    placeholder="Ex: https://fadev.org" 
                    value={formData.source}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="twoPhaseScraping"
                    checked={formData.twoPhaseScraping === 'true'}
                    onChange={(e) => handleInputChange('twoPhaseScraping', e.target.checked ? 'true' : 'false')}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="twoPhaseScraping" className="text-sm font-medium">
                    Scraping en deux phases (pour les données dans des dropdowns)
                  </label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Activez cette option si les données sont cachées derrière des dropdowns
                </p>
              </div>

              {/* Phase 1 Selectors */}
              {formData.twoPhaseScraping === 'true' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Phase 1 - Liste des entreprises</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="phase1.name">Sélecteur du nom</label>
                      <Input
                        id="phase1.name"
                        value={formData.phase1Selectors.name}
                        onChange={(e) => handleInputChange('phase1.name', e.target.value)}
                        placeholder="Exemple: .company-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phase1.dropdownTrigger">Sélecteur du déclencheur</label>
                      <Input
                        id="phase1.dropdownTrigger"
                        value={formData.phase1Selectors.dropdownTrigger}
                        onChange={(e) => handleInputChange('phase1.dropdownTrigger', e.target.value)}
                        placeholder="Exemple: .dropdown-trigger"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Phase 2 Selectors */}
              {formData.twoPhaseScraping === 'true' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Phase 2 - Détails de l'entreprise</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="phase2.name">Sélecteur du nom</label>
                      <Input
                        id="phase2.name"
                        value={formData.phase2Selectors.name}
                        onChange={(e) => handleInputChange('phase2.name', e.target.value)}
                        placeholder="Exemple: .company-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phase2.phone">Sélecteur du téléphone</label>
                      <Input
                        id="phase2.phone"
                        value={formData.phase2Selectors.phone}
                        onChange={(e) => handleInputChange('phase2.phone', e.target.value)}
                        placeholder="Exemple: .phone-number"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phase2.email">Sélecteur de l'email</label>
                      <Input
                        id="phase2.email"
                        value={formData.phase2Selectors.email}
                        onChange={(e) => handleInputChange('phase2.email', e.target.value)}
                        placeholder="Exemple: .email-address"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phase2.website">Sélecteur du site web</label>
                      <Input
                        id="phase2.website"
                        value={formData.phase2Selectors.website}
                        onChange={(e) => handleInputChange('phase2.website', e.target.value)}
                        placeholder="Exemple: .website-url"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phase2.address">Sélecteur de l'adresse</label>
                      <Input
                        id="phase2.address"
                        value={formData.phase2Selectors.address}
                        onChange={(e) => handleInputChange('phase2.address', e.target.value)}
                        placeholder="Exemple: .address-text"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="selector" className="text-sm font-medium">Sélecteurs CSS</label>
                <Input 
                  id="selector" 
                  placeholder="Ex: .card, span.palmares-phone, a[href^='mailto:'], a[href^='http']"
                  value={formData.selector}
                  onChange={(e) => handleInputChange('selector', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="paginationSelector" className="text-sm font-medium">Sélecteur de pagination (optionnel)</label>
                <Input
                  id="paginationSelector"
                  placeholder="Ex: .pagination-next, .Pagination-link[rel=next]"
                  value={formData.paginationSelector}
                  onChange={(e) => handleInputChange('paginationSelector', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="dropdownClickSelector" className="text-sm font-medium">Sélecteur pour ouvrir les dropdowns (optionnel)</label>
                <Input
                  id="dropdownClickSelector"
                  placeholder="Ex: .accordion-toggle, .dropdown-arrow"
                  value={formData.dropdownClickSelector || ''}
                  onChange={(e) => handleInputChange('dropdownClickSelector', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="childSelectors" className="text-sm font-medium">Sélecteurs enfants (JSON)</label>
                <Textarea
                  id="childSelectors"
                      placeholder={`Exemple: {"name": "h3.SearchResult-title", "phone": "span.SearchResult-btnText", "address": "small.SearchResult-location a", "sector": "div.SearchResult-description"}`}
                  value={formData.childSelectors || ''}
                  onChange={(e) => handleInputChange('childSelectors', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="engine" className="text-sm font-medium">Moteur de scraping</label>
                <Select
                  value={formData.engine}
                  onValueChange={(value: 'playwright' | 'puppeteer') => handleInputChange('engine', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un moteur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="playwright">Playwright (recommandé)</SelectItem>
                    <SelectItem value="puppeteer">Puppeteer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="frequency" className="text-sm font-medium">Fréquence</label>
                <Select 
                  value={formData.frequency} 
                  onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'manual') => handleInputChange('frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une fréquence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                    <SelectItem value="manual">Manuel uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="country" className="text-sm font-medium">Pays</label>
                <Select
                  value={formData.country || ''}
                  onValueChange={(value) => handleInputChange('country', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un pays" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="bg-africa-green-500 hover:bg-africa-green-600"
                disabled={loading}
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}


