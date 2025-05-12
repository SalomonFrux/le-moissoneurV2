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
import { Plus, Code, Save, RefreshCw, Search, Filter } from 'lucide-react';
import { ScraperCard, ScraperData } from './ScraperCard';
import { toast } from 'sonner';
import { getAllScrapers, runScraper, getScraperStatus, createScraper, deleteScraper, updateScraper } from '@/services/scraperService';
import { dataService } from '@/services/dataService';

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
  twoPhaseScraping?: boolean;
  phase1Selectors?: {
    name: string;
    dropdownTrigger?: string;
  };
  phase2Selectors?: {
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
    twoPhaseScraping: false,
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
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchScrapers();
  }, []);

  const fetchScrapers = async () => {
    try {
      setLoading(true);
      const data = await getAllScrapers();
      setScrapers(data);
    } catch (error) {
      toast.error('Failed to fetch scrapers');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNewScraper = () => {
    setShowForm(true);
    setFormData({ name: '', source: '', selector: '', paginationSelector: '', dropdownClickSelector: '', childSelectors: '', engine: 'playwright', frequency: 'manual', country: '', twoPhaseScraping: false, phase1Selectors: { name: '', dropdownTrigger: '' }, phase2Selectors: { name: '', phone: '', email: '', website: '', address: '' } });
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({ name: '', source: '', selector: '', paginationSelector: '', dropdownClickSelector: '', childSelectors: '', engine: 'playwright', frequency: 'manual', country: '', twoPhaseScraping: false, phase1Selectors: { name: '', dropdownTrigger: '' }, phase2Selectors: { name: '', phone: '', email: '', website: '', address: '' } });
  };

  const handleEditScraper = (scraper: ScraperData) => {
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
      twoPhaseScraping: false,
      phase1Selectors: { name: '', dropdownTrigger: '' },
      phase2Selectors: { name: '', phone: '', email: '', website: '', address: '' }
    });
    setShowForm(true);
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

  const handleCreateScraper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.source) {
      toast.error('Le nom et l\'URL de la source sont requis');
      return;
    }

    try {
      setLoading(true);
      const scraperData = {
        name: formData.name,
        source: formData.source,
        selectors: formData.selector || formData.paginationSelector || formData.dropdownClickSelector || formData.childSelectors ? {
          main: formData.selector,
          pagination: formData.paginationSelector,
          dropdownClick: formData.dropdownClickSelector,
          child: formData.childSelectors ? JSON.parse(formData.childSelectors) : undefined
        } : undefined,
        frequency: formData.frequency,
        status: 'idle',
        dataCount: 0,
        type: formData.engine,
        country: formData.country || 'Unknown'
      };

      const newScraper = await createScraper(scraperData);
      setScrapers(prev => [...prev, newScraper]);
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
        twoPhaseScraping: false,
        phase1Selectors: { name: '', dropdownTrigger: '' },
        phase2Selectors: { name: '', phone: '', email: '', website: '', address: '' }
      });
      setShowForm(false);
      toast.success('Scraper créé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la création du scraper');
    } finally {
      setLoading(false);
    }
  };

  const handleRunScraper = async (id: string) => {
    try {
      setLoading(true);
      await runScraper(id);
      const updatedScraper = await getScraperStatus(id);
      
      setScrapers(prev =>
        prev.map(scraper =>
          scraper.id === id ? { ...scraper, ...updatedScraper } : scraper
        )
      );
      
      // Fetch the scraped data for this scraper
      const scrapedData = await dataService.fetchScrapedData(id);
      toast.success(`${scrapedData.length} entrées collectées`);
    } catch (error) {
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
      setExpandedScrapers(prev => {
        const newSet = new Set(prev);
        newSet.add(id);
        return newSet;
      });
      setScrapedData(prev => ({ ...prev, [id]: data }));
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Filter and paginate scrapers
  const filteredScrapers = scrapers.filter(scraper => 
    scraper.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filteredScrapers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedScrapers = filteredScrapers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold font-heading tracking-tight">Scrapers</h2>
        <Button onClick={handleNewScraper}>
          <Plus className="mr-2 h-4 w-4" /> Nouveau Scraper
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex gap-4 items-center mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un scraper..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchScrapers}>
            <RefreshCw className="mr-2 h-4 w-4" /> Actualiser
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginatedScrapers.map((scraper) => (
            <ScraperCard
              key={scraper.id}
              scraper={scraper}
              onRunScraper={handleRunScraper}
              onStopScraper={handleStopScraper}
              onViewData={handleViewData}
              onEditScraper={handleEditScraper}
              onDeleteScraper={handleDeleteScraper}
            />
          ))}
        </div>

        {filteredScrapers.length > itemsPerPage && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredScrapers.length)} sur {filteredScrapers.length} scrapers
              </p>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Par page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <span className="text-sm">
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </Card>
      
      {showForm && (
        <Card>
          <form onSubmit={handleCreateScraper}>
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
                    checked={formData.twoPhaseScraping}
                    onChange={(e) => handleInputChange('twoPhaseScraping', e.target.checked)}
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

              {formData.twoPhaseScraping ? (
                <>
                  <div className="space-y-4 border rounded-lg p-4">
                    <h3 className="font-medium">Phase 1 - Liste des entreprises</h3>
                    <div className="space-y-2">
                      <label htmlFor="phase1Name" className="text-sm font-medium">Sélecteur du nom de l'entreprise</label>
                      <Input
                        id="phase1Name"
                        placeholder="Ex: .company-name"
                        value={formData.phase1Selectors?.name}
                        onChange={(e) => handleInputChange('phase1Selectors', {
                          ...formData.phase1Selectors,
                          name: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phase1Dropdown" className="text-sm font-medium">Sélecteur du bouton dropdown</label>
                      <Input
                        id="phase1Dropdown"
                        placeholder="Ex: .dropdown-toggle"
                        value={formData.phase1Selectors?.dropdownTrigger}
                        onChange={(e) => handleInputChange('phase1Selectors', {
                          ...formData.phase1Selectors,
                          dropdownTrigger: e.target.value
                        })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border rounded-lg p-4">
                    <h3 className="font-medium">Phase 2 - Détails de l'entreprise</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="phase2Name" className="text-sm font-medium">Nom</label>
                        <Input
                          id="phase2Name"
                          placeholder="Ex: .details-name"
                          value={formData.phase2Selectors?.name}
                          onChange={(e) => handleInputChange('phase2Selectors', {
                            ...formData.phase2Selectors,
                            name: e.target.value
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="phase2Phone" className="text-sm font-medium">Téléphone</label>
                        <Input
                          id="phase2Phone"
                          placeholder="Ex: .details-phone"
                          value={formData.phase2Selectors?.phone}
                          onChange={(e) => handleInputChange('phase2Selectors', {
                            ...formData.phase2Selectors,
                            phone: e.target.value
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="phase2Email" className="text-sm font-medium">Email</label>
                        <Input
                          id="phase2Email"
                          placeholder="Ex: .details-email"
                          value={formData.phase2Selectors?.email}
                          onChange={(e) => handleInputChange('phase2Selectors', {
                            ...formData.phase2Selectors,
                            email: e.target.value
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="phase2Website" className="text-sm font-medium">Site Web</label>
                        <Input
                          id="phase2Website"
                          placeholder="Ex: .details-website"
                          value={formData.phase2Selectors?.website}
                          onChange={(e) => handleInputChange('phase2Selectors', {
                            ...formData.phase2Selectors,
                            website: e.target.value
                          })}
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <label htmlFor="phase2Address" className="text-sm font-medium">Adresse</label>
                        <Input
                          id="phase2Address"
                          placeholder="Ex: .details-address"
                          value={formData.phase2Selectors?.address}
                          onChange={(e) => handleInputChange('phase2Selectors', {
                            ...formData.phase2Selectors,
                            address: e.target.value
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}

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


