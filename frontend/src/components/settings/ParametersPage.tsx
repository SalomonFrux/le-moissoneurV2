
import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  Bell, 
  Key, 
  CloudUpload
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ParametersPage() {
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [automatedExport, setAutomatedExport] = useState(false);
  const [compressionEnabled, setCompressionEnabled] = useState(false);

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-start justify-between">
        <h2 className="text-3xl font-bold font-heading tracking-tight">Paramètres</h2>
      </div>

      <Tabs defaultValue="scrapers" className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="scrapers" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Scrapers</span>
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>Stockage</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="apikeys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span>API Keys</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <CloudUpload className="h-4 w-4" />
            <span>Export</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Scrapers Configuration */}
        <TabsContent value="scrapers">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration des proxies</CardTitle>
                <CardDescription>Définir les paramètres de proxies pour les scrapers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="proxy-enabled">Activer les proxies</Label>
                  <Switch 
                    id="proxy-enabled"
                    checked={proxyEnabled}
                    onCheckedChange={setProxyEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proxy-list">Liste de proxies</Label>
                  <Input 
                    id="proxy-list"
                    placeholder="ip:port,username:password"
                    disabled={!proxyEnabled}
                  />
                  <p className="text-xs text-muted-foreground">Format: ip:port,username:password (un proxy par ligne)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proxy-rotation">Rotation des proxies</Label>
                  <Select disabled={!proxyEnabled}>
                    <SelectTrigger id="proxy-rotation">
                      <SelectValue placeholder="Sélectionner une stratégie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sequential">Séquentielle</SelectItem>
                      <SelectItem value="random">Aléatoire</SelectItem>
                      <SelectItem value="session">Par session</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Délais et timeouts</CardTitle>
                <CardDescription>Configuration des délais entre les requêtes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="request-delay">Délai entre les requêtes (ms)</Label>
                  <Input 
                    id="request-delay"
                    type="number" 
                    defaultValue="2000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout des requêtes (ms)</Label>
                  <Input 
                    id="timeout"
                    type="number" 
                    defaultValue="30000" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retry-attempts">Nombre de tentatives</Label>
                  <Input 
                    id="retry-attempts"
                    type="number" 
                    defaultValue="3"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>User-Agents</CardTitle>
                <CardDescription>Configuration des user-agents pour les scrapers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-agent-strategy">Stratégie de rotation</Label>
                  <Select>
                    <SelectTrigger id="user-agent-strategy">
                      <SelectValue placeholder="Sélectionner une stratégie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">User-agent fixe</SelectItem>
                      <SelectItem value="random">Rotation aléatoire</SelectItem>
                      <SelectItem value="browser">Simuler navigation réelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-agents">Liste de User-Agents</Label>
                  <Input 
                    id="user-agents"
                    className="h-24"
                    placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36..."
                  />
                  <p className="text-xs text-muted-foreground">Un user-agent par ligne</p>
                </div>
                <Button className="mt-4">Enregistrer</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Storage Configuration */}
        <TabsContent value="storage">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Format de stockage</CardTitle>
                <CardDescription>Configuration du format des données collectées</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="data-format">Format primaire</Label>
                  <Select>
                    <SelectTrigger id="data-format">
                      <SelectValue placeholder="Sélectionner un format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xml">XML</SelectItem>
                      <SelectItem value="sql">SQL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="structure-type">Structure</Label>
                  <Select>
                    <SelectTrigger id="structure-type">
                      <SelectValue placeholder="Sélectionner une structure" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Structure plate</SelectItem>
                      <SelectItem value="nested">Structure imbriquée</SelectItem>
                      <SelectItem value="relational">Structure relationnelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compression</CardTitle>
                <CardDescription>Paramètres de compression des données</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="compression-enabled">Activer la compression</Label>
                  <Switch 
                    id="compression-enabled"
                    checked={compressionEnabled}
                    onCheckedChange={setCompressionEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compression-algorithm">Algorithme</Label>
                  <Select disabled={!compressionEnabled}>
                    <SelectTrigger id="compression-algorithm">
                      <SelectValue placeholder="Sélectionner un algorithme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gzip">GZIP</SelectItem>
                      <SelectItem value="zip">ZIP</SelectItem>
                      <SelectItem value="bzip2">BZIP2</SelectItem>
                      <SelectItem value="lzma">LZMA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compression-level">Niveau de compression</Label>
                  <Select disabled={!compressionEnabled}>
                    <SelectTrigger id="compression-level">
                      <SelectValue placeholder="Sélectionner un niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Faible (rapide)</SelectItem>
                      <SelectItem value="6">Moyen</SelectItem>
                      <SelectItem value="9">Élevé (lent)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Rétention des données</CardTitle>
                <CardDescription>Politique de conservation et archivage des données</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="retention-period">Période de rétention</Label>
                  <Select>
                    <SelectTrigger id="retention-period">
                      <SelectValue placeholder="Sélectionner une période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1month">1 mois</SelectItem>
                      <SelectItem value="3months">3 mois</SelectItem>
                      <SelectItem value="6months">6 mois</SelectItem>
                      <SelectItem value="1year">1 an</SelectItem>
                      <SelectItem value="forever">Indéfinie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="archiving-strategy">Stratégie d'archivage</Label>
                  <Select>
                    <SelectTrigger id="archiving-strategy">
                      <SelectValue placeholder="Sélectionner une stratégie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delete">Supprimer les anciennes données</SelectItem>
                      <SelectItem value="archive">Archiver les anciennes données</SelectItem>
                      <SelectItem value="aggregate">Agréger les anciennes données</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="mt-4">Enregistrer</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Notifications Configuration */}
        <TabsContent value="notifications">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications par email</CardTitle>
                <CardDescription>Configuration des alertes par email</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications">Activer les notifications</Label>
                  <Switch 
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-recipients">Destinataires</Label>
                  <Input 
                    id="email-recipients"
                    placeholder="email@example.com, email2@example.com"
                    disabled={!emailNotifications}
                  />
                  <p className="text-xs text-muted-foreground">Séparez les adresses par des virgules</p>
                </div>
                <div className="space-y-2">
                  <Label>Événements</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="event-scraper-complete" disabled={!emailNotifications} />
                      <Label htmlFor="event-scraper-complete">Fin de scraping</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="event-error" disabled={!emailNotifications} />
                      <Label htmlFor="event-error">Erreurs critiques</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="event-data-threshold" disabled={!emailNotifications} />
                      <Label htmlFor="event-data-threshold">Seuil de données atteint</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications de l'interface</CardTitle>
                <CardDescription>Configuration des alertes dans l'application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ui-notification-level">Niveau des notifications</Label>
                  <Select>
                    <SelectTrigger id="ui-notification-level">
                      <SelectValue placeholder="Sélectionner un niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les notifications</SelectItem>
                      <SelectItem value="info">Informations et plus importantes</SelectItem>
                      <SelectItem value="warning">Avertissements et erreurs</SelectItem>
                      <SelectItem value="error">Erreurs seulement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification-position">Position des notifications</Label>
                  <Select>
                    <SelectTrigger id="notification-position">
                      <SelectValue placeholder="Sélectionner une position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-right">Haut droite</SelectItem>
                      <SelectItem value="top-left">Haut gauche</SelectItem>
                      <SelectItem value="bottom-right">Bas droite</SelectItem>
                      <SelectItem value="bottom-left">Bas gauche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification-duration">Durée d'affichage (s)</Label>
                  <Input id="notification-duration" type="number" defaultValue="5" />
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Intégrations externes</CardTitle>
                <CardDescription>Configuration des notifications vers des services externes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Services disponibles</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 border rounded-md p-3">
                      <input type="checkbox" id="service-slack" />
                      <div>
                        <Label htmlFor="service-slack">Slack</Label>
                        <p className="text-xs text-muted-foreground">Notifications dans un canal Slack</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-md p-3">
                      <input type="checkbox" id="service-telegram" />
                      <div>
                        <Label htmlFor="service-telegram">Telegram</Label>
                        <p className="text-xs text-muted-foreground">Notifications dans un groupe Telegram</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-md p-3">
                      <input type="checkbox" id="service-webhook" />
                      <div>
                        <Label htmlFor="service-webhook">Webhook</Label>
                        <p className="text-xs text-muted-foreground">Envoi d'événements via webhook</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-md p-3">
                      <input type="checkbox" id="service-sms" />
                      <div>
                        <Label htmlFor="service-sms">SMS</Label>
                        <p className="text-xs text-muted-foreground">Alertes critiques par SMS</p>
                      </div>
                    </div>
                  </div>
                </div>
                <Button className="mt-4">Configurer les intégrations</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* API Keys Configuration */}
        <TabsContent value="apikeys">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Services d'enrichissement</CardTitle>
                <CardDescription>Clés API pour les services d'enrichissement de données</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="api-clearbit">Clearbit API</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="api-clearbit"
                        type="password"
                        placeholder="sk_..." 
                      />
                      <Button variant="outline" size="sm">Valider</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Pour enrichir les données d'entreprises</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="api-hunter">Hunter.io API</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="api-hunter"
                        type="password"
                        placeholder="..." 
                      />
                      <Button variant="outline" size="sm">Valider</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Pour vérifier les adresses email</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="api-opencorporates">OpenCorporates API</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="api-opencorporates"
                        type="password"
                        placeholder="..." 
                      />
                      <Button variant="outline" size="sm">Valider</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Pour les informations légales</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Services géographiques</CardTitle>
                <CardDescription>Clés API pour les services de géolocalisation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="api-googlemaps">Google Maps API</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="api-googlemaps"
                        type="password"
                        placeholder="..." 
                      />
                      <Button variant="outline" size="sm">Valider</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Pour la géolocalisation et les cartes</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="api-ip-geolocation">IP Geolocation API</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="api-ip-geolocation"
                        type="password"
                        placeholder="..." 
                      />
                      <Button variant="outline" size="sm">Valider</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Pour localiser les adresses IP</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Paramètres d'API</CardTitle>
                <CardDescription>Configuration générale pour l'utilisation des API</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-retry-strategy">Stratégie de retry</Label>
                    <Select>
                      <SelectTrigger id="api-retry-strategy">
                        <SelectValue placeholder="Sélectionner une stratégie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exponential">Exponential Backoff</SelectItem>
                        <SelectItem value="fixed">Délai fixe</SelectItem>
                        <SelectItem value="none">Sans retry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api-fallback">Comportement de secours</Label>
                    <Select>
                      <SelectTrigger id="api-fallback">
                        <SelectValue placeholder="Sélectionner un comportement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Ignorer l'enrichissement</SelectItem>
                        <SelectItem value="alternative">Utiliser une API alternative</SelectItem>
                        <SelectItem value="queue">Mettre en file d'attente pour réessai ultérieur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api-quota-management">Gestion des quotas</Label>
                    <Select>
                      <SelectTrigger id="api-quota-management">
                        <SelectValue placeholder="Sélectionner une stratégie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strict">Strict (arrêter à l'épuisement)</SelectItem>
                        <SelectItem value="distribute">Répartir sur la journée</SelectItem>
                        <SelectItem value="priority">Prioriser certaines requêtes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="mt-4">Enregistrer les paramètres</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Export Configuration */}
        <TabsContent value="export">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Export automatique</CardTitle>
                <CardDescription>Configuration des exports automatiques des données</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="automated-export">Activer l'export automatique</Label>
                  <Switch 
                    id="automated-export"
                    checked={automatedExport}
                    onCheckedChange={setAutomatedExport}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="export-frequency">Fréquence</Label>
                  <Select disabled={!automatedExport}>
                    <SelectTrigger id="export-frequency">
                      <SelectValue placeholder="Sélectionner une fréquence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuelle</SelectItem>
                      <SelectItem value="event">À chaque nouvelle donnée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="export-destination">Destination</Label>
                  <Select disabled={!automatedExport}>
                    <SelectTrigger id="export-destination">
                      <SelectValue placeholder="Sélectionner une destination" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="ftp">Serveur FTP</SelectItem>
                      <SelectItem value="s3">Amazon S3</SelectItem>
                      <SelectItem value="gdrive">Google Drive</SelectItem>
                      <SelectItem value="dropbox">Dropbox</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Formats d'export</CardTitle>
                <CardDescription>Configuration des formats pour l'export des données</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Formats disponibles</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="format-csv" checked readOnly />
                      <Label htmlFor="format-csv">CSV</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="format-json" checked readOnly />
                      <Label htmlFor="format-json">JSON</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="format-excel" />
                      <Label htmlFor="format-excel">Excel (.xlsx)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="format-pdf" />
                      <Label htmlFor="format-pdf">PDF</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="format-sql" />
                      <Label htmlFor="format-sql">SQL</Label>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="export-encoding">Encodage</Label>
                  <Select>
                    <SelectTrigger id="export-encoding">
                      <SelectValue placeholder="Sélectionner un encodage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utf8">UTF-8</SelectItem>
                      <SelectItem value="latin1">ISO-8859-1</SelectItem>
                      <SelectItem value="ascii">ASCII</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Données à exporter</CardTitle>
                <CardDescription>Sélection des données à inclure dans les exports automatiques</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Champs à inclure</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="field-name" checked readOnly />
                        <Label htmlFor="field-name">Nom de l'entreprise</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="field-website" checked readOnly />
                        <Label htmlFor="field-website">Site web</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="field-country" checked readOnly />
                        <Label htmlFor="field-country">Pays</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="field-sector" checked readOnly />
                        <Label htmlFor="field-sector">Secteur d'activité</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="field-funding" />
                        <Label htmlFor="field-funding">Financement</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="field-description" />
                        <Label htmlFor="field-description">Description</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="field-contacts" />
                        <Label htmlFor="field-contacts">Contacts</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="field-social" />
                        <Label htmlFor="field-social">Réseaux sociaux</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="field-metrics" />
                        <Label htmlFor="field-metrics">Métriques</Label>
                      </div>
                    </div>
                  </div>
                  <Button className="mt-4">Enregistrer la configuration</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
