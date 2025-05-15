import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { dataService } from '@/services/dataService';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CountryData {
  pays: string;
  entreprises: number;
  completeness: number;
  mainSectors: string[];
}

interface RegionData {
  name: string;
  value: number;
  percentage: number;
  mainSectors: string[];
}

const COLORS = {
  enterprises: '#2D8B61',
  completeness: '#9C6B22'
};

// Updated color mapping for regions
const REGION_COLORS = {
  'Ouest Afrique': '#FF5733',
  'Nord Afrique': '#33FF57',
  'Centre Afrique': '#3357FF',
  'Est Afrique': '#F1C40F',
  'Sud Afrique': '#8E44AD',
  'Ouest Europe': '#2D8B61',
  'Europe Centrale': '#56BC82',
  'Europe du Sud': '#8ED6AF',
  'Europe du Nord': '#BDECD3',
  'Europe de l’Est': '#DCF1E7',
  'USA': '#FF8C00',
  'Autre': '#A9A9A9'
};

// Utility to normalize country names for mapping
function normalizeCountryName(country: string): string {
  return country
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '') // Remove accents
    .replace(/[’‘`´]/g, "'") // Normalize apostrophes
    .replace(/\s+/g, ' ')
    .trim();
}

// Dynamic country-to-region mapping based on scraped countries
const getRegionForCountry = (country: string): string => {
  if (!country || country === 'Non spécifié') return 'Autre';
  const c = normalizeCountryName(country);
  // Africa
  if (["cote d'ivoire", "côte d'ivoire", 'ivory coast', 'senegal', 'mali', 'burkina faso', 'guinee', 'togo', 'benin', 'niger', 'ghana', 'nigeria', 'liberia', 'sierra leone', 'gambie', 'gambia', 'cap-vert', 'cape verde'].includes(c)) return 'Ouest Afrique';
  if (['maroc', 'morocco', 'algerie', 'algeria', 'tunisie', 'tunisia', 'libye', 'libya', 'egypte', 'egypt'].includes(c)) return 'Nord Afrique';
  if (['cameroun', 'cameroon', 'gabon', 'centrafrique', 'central african republic', 'rca', 'guinee equatoriale', 'equatorial guinea', 'congo', 'congo-brazzaville', 'congo republic', 'sao tome-et-principe', 'sao tome and principe', 'tchad', 'chad'].includes(c)) return 'Centre Afrique';
  if (['rdc', 'republique democratique du congo', 'democratic republic of the congo', 'angola', 'namibie', 'namibia', 'afrique du sud', 'south africa', 'botswana', 'zambie', 'zambia', 'zimbabwe', 'malawi', 'mozambique', 'lesotho', 'swaziland', 'eswatini'].includes(c)) return 'Sud Afrique';
  if (['kenya', 'tanzanie', 'tanzania', 'ouganda', 'uganda', 'rwanda', 'burundi', 'ethiopie', 'ethiopia', 'somalie', 'somalia', 'soudan', 'sudan', 'soudan du sud', 'south sudan', 'djibouti', 'erythree', 'eritrea'].includes(c)) return 'Est Afrique';
  // Europe
  if (['france', 'espagne', 'spain', 'portugal', 'belgique', 'belgium', 'royaume-uni', 'united kingdom', 'angleterre', 'england', 'irlande', 'ireland', 'pays-bas', 'netherlands'].includes(c)) return 'Ouest Europe';
  if (['allemagne', 'germany', 'autriche', 'austria', 'pologne', 'poland', 'suisse', 'switzerland', 'hongrie', 'hungary', 'tchequie', 'czech republic', 'slovaquie', 'slovakia'].includes(c)) return 'Europe Centrale';
  if (['italie', 'italy', 'espagne', 'spain', 'grece', 'greece', 'croatie', 'croatia', 'slovenie', 'slovenia', 'malte', 'malta'].includes(c)) return 'Europe du Sud';
  if (['norvege', 'norway', 'suede', 'sweden', 'finlande', 'finland', 'danemark', 'denmark', 'islande', 'iceland'].includes(c)) return 'Europe du Nord';
  if (['roumanie', 'romania', 'bulgarie', 'bulgaria', 'serbie', 'serbia', 'ukraine', 'moldavie', 'moldova', 'russie', 'russia'].includes(c)) return 'Europe de l’Est';
  // USA
  if (['etats-unis', 'united states', 'usa', 'us'].includes(c)) return 'USA';
  // Default
  return 'Autre';
};

export function GeographicDistribution() {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionDetails, setRegionDetails] = useState<Record<string, { entreprises: number; mainSectors: Set<string> }>>({});
  const [expandedSectors, setExpandedSectors] = useState<{ [key: string]: boolean }>({}); // State to manage expansion of sectors
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null); // Track the expanded region

  useEffect(() => {
    async function fetchGeographicData() {
      try {
        const data = await dataService.fetchAllScrapedData();
        const allEntries = data.flatMap(group => group.entries);
        
        // Process country data
        const countryData = allEntries.reduce((acc, entry) => {
          const country = entry.pays === 'Aucune donnée' ? 'Non spécifié' : (entry.pays || 'Non spécifié');
          if (!acc[country]) {
            acc[country] = {
              pays: country,
              entreprises: 0,
              completeness: 0,
              mainSectors: []
            };
          }
          acc[country].entreprises++;
          // Calculate completeness
          const fields = ['nom', 'email', 'telephone', 'adresse', 'secteur'];
          const filledFields = fields.filter(field => entry[field] && entry[field] !== 'Aucune donnée').length;
          acc[country].completeness += (filledFields / fields.length) * 100;
          // Track sectors
          if (entry.secteur && entry.secteur !== 'Aucune donnée') {
            acc[country]._sectorSet = acc[country]._sectorSet || new Set();
            acc[country]._sectorSet.add(entry.secteur);
          }
          return acc;
        }, {} as Record<string, any>);
        // Convert to array and calculate averages
        const countryArray = Object.values(countryData)
          .map(country => {
            const mainSectors = country._sectorSet ? Array.from(country._sectorSet).slice(0, 3) : [];
            return {
              ...country,
              completeness: Math.round(country.completeness / country.entreprises),
              mainSectors
            };
          })
          .sort((a, b) => b.entreprises - a.entreprises);

        // --- Dynamic region aggregation ---
        const dynamicRegionDetails: Record<string, { entreprises: number; mainSectors: Set<string> }> = {};
        allEntries.forEach(entry => {
          const country = entry.pays === 'Aucune donnée' ? 'Non spécifié' : (entry.pays || 'Non spécifié');
          const region = getRegionForCountry(country);
          if (!dynamicRegionDetails[region]) {
            dynamicRegionDetails[region] = { entreprises: 0, mainSectors: new Set() };
          }
          dynamicRegionDetails[region].entreprises++;
          if (entry.secteur && entry.secteur !== 'Aucune donnée') {
            dynamicRegionDetails[region].mainSectors.add(entry.secteur.split(' > ')[0].trim());
          }
        });
        setRegionDetails(dynamicRegionDetails);

        // Process region data based on countries
        const regionMapping: Record<string, string[]> = {
          'Ouest': ['Sénégal', 'Mali', 'Guinée', 'Guinée-Bissau', 'Mauritanie'],
          'Est': ['Tchad', 'Soudan', 'Éthiopie', 'Djibouti', 'Érythrée'],
          'Sud': ['Congo', 'RDC', 'Angola', 'Namibie', 'Afrique du Sud'],
          'Nord': ['Maroc', 'Algérie', 'Tunisie', 'Libye', 'Égypte'],
          'Centre': ['Cameroun', 'Gabon', 'RCA', 'Guinée équatoriale', 'São Tomé-et-Principe']
        };

        const regionData = Object.entries(regionMapping).reduce((acc, [region, countries]) => {
          const regionEntries = countryArray.filter(country => 
            countries.some(c => country.pays.toLowerCase().includes(c.toLowerCase()))
          );
          
          const total = regionEntries.reduce((sum, country) => sum + country.entreprises, 0);
          const sectors = new Set<string>();
          regionEntries.forEach(country => {
            country.mainSectors.forEach(sector => sectors.add(sector));
          });
          
          acc[region] = {
            name: region,
            value: total,
            percentage: 0, // Will be calculated after
            mainSectors: Array.from(sectors).slice(0, 3)
          };
          
          return acc;
        }, {} as Record<string, RegionData>);

        // Calculate percentages
        const totalRegions = Object.values(regionData).reduce((sum, region) => sum + region.value, 0);
        const regionArray = Object.values(regionData).map(region => ({
          ...region,
          percentage: totalRegions > 0 ? (region.value / totalRegions) * 100 : 0
        }));

        setCountries(countryArray);
        setRegions(regionArray);
      } catch (error) {
        console.error('Error fetching geographic data:', error);
        toast.error('Erreur lors du chargement des données géographiques');
      } finally {
        setLoading(false);
      }
    }
    fetchGeographicData();
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-medium">{label}</p>
          {payload.map((p: any) => (
            <p key={p.dataKey} style={{ color: p.color }}>
              {p.dataKey === 'entreprises' ? 'Entreprises: ' : p.dataKey === 'completeness' ? 'Complétude: ' : p.dataKey}
              {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}{p.dataKey === 'completeness' ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div>Chargement des données géographiques...</div>;
  }

  // List of all possible regions to display (in preferred order)
  const allDynamicRegions = [
    'Ouest Afrique',
    'Nord Afrique',
    'Centre Afrique',
    'Est Afrique',
    'Sud Afrique',
    'Ouest Europe',
    'Europe Centrale',
    'Europe du Sud',
    'Europe du Nord',
    'Europe de l’Est',
    'USA',
    'Autre',
  ];

  const toggleSectorExpansion = (region: string) => {
    setExpandedSectors((prev) => ({
      ...prev,
      [region]: !prev[region],
    }));
  };

  const toggleRegionDetails = () => {
    setExpandedRegion(expandedRegion ? null : 'Détails par région'); // Toggle the expanded region
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full"> {/* Ensure the grid takes full width */}
      
      {/* Card for Détails par région */}
      {expandedRegion ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:col-span-3 transition-all duration-300">
          {allDynamicRegions.map((region) => {
            const details = regionDetails[region] || { entreprises: 0, mainSectors: new Set() };
            const total = Object.values(regionDetails).reduce((a, b) => a + b.entreprises, 0);
            return (
              <Card key={region} className="p-6 overflow-hidden transition-all duration-300 ease-in-out">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{region}</h3>
                  <button 
                    className="text-blue-500 hover:underline"
                    onClick={() => toggleSectorExpansion(region)} // Toggle sector expansion
                  >
                    {expandedSectors[region] ? 'Voir moins' : 'Voir plus'}
                  </button>
                </div>
                <div className="mt-2">
                  <p>{details.entreprises} entreprises</p>
                  <p>Complétude: {total > 0 ? ((details.entreprises / total) * 100).toFixed(1) : '0'}%</p>
                </div>
                {expandedSectors[region] && (
                  <div className="mt-4">
                    <h4 className="font-semibold">Secteurs principaux:</h4>
                    <ul className="list-disc pl-5">
                      {[...details.mainSectors].slice(0, 3).map((sector, sectorIndex) => (
                        <li key={sector} className="flex justify-between">
                          <span className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: REGION_COLORS[region.name] }} // Color for the sector
                            />
                            {sector}
                          </span>
                          <span>{details.entreprises} entreprises</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <>
          {/* Card for Répartition géographique des entreprises */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Répartition géographique des entreprises</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={countries}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="pays" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="entreprises" name="Entreprises" fill={COLORS.enterprises} />
                  <Bar dataKey="completeness" name="Complétude (%)" fill={COLORS.completeness} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Card for Legend of Répartition régionale */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Légende de la Répartition régionale</h3>
            <div className="flex flex-col">
              {regions.map((region) => (
                <div key={region.name} className="flex items-center mb-2">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: REGION_COLORS[region.name] }} // Color for the region
                  />
                  <span className="font-medium">{region.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Button to toggle Détails par région */}
      <div className="lg:col-span-3 mb-2 flex justify-end">
        <button 
           className="px-4 py-2 border border-grey bg-[#] text-black rounded hover:bg-[#FF6F20] hover:text-white transition flex items-center"
          onClick={toggleRegionDetails}
        >
          {expandedRegion ? 'Cacher -' : 'Voir Plus +'}
        </button>
      </div>





    </div>
  );
}

export default GeographicDistribution;