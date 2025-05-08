
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Layers, 
  Database, 
  RefreshCw, 
  ChevronRight, 
  ExternalLink, 
  PlusCircle,
  Settings,
  Key
} from 'lucide-react';

export function EnrichmentPage() {
  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-heading tracking-tight">Enrichissement</h2>
          <p className="text-muted-foreground">Enrichissez vos données collectées avec des sources externes</p>
        </div>
        <Button className="bg-africa-green hover:bg-africa-green-600">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouvelle tâche d'enrichissement
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-africa-sand-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between">
              <span>Sources intégrées</span>
              <Badge className="bg-africa-green">5</Badge>
            </CardTitle>
            <CardDescription>Sources de données pour enrichissement</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">100%</CardContent>
        </Card>
        <Card className="bg-white border-africa-sand-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between">
              <span>Tâches en cours</span>
              <Badge className="bg-africa-earth">2</Badge>
            </CardTitle>
            <CardDescription>Enrichissements actifs</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            <div className="flex items-center">
              <span>45%</span>
              <RefreshCw className="ml-2 h-4 w-4 animate-spin text-africa-earth" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-africa-sand-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between">
              <span>Données enrichies</span>
              <Badge className="bg-africa-sand-500">158</Badge>
            </CardTitle>
            <CardDescription>Entreprises enrichies</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">62%</CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="active">Tâches Actives</TabsTrigger>
          <TabsTrigger value="sources">Sources Externes</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-6">
          <div className="space-y-4">
            <Card className="bg-white hover:bg-africa-sand-50 transition-colors">
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>Enrichissement LinkedIn</CardTitle>
                  <Badge className="bg-africa-earth">En cours</Badge>
                </div>
                <CardDescription>Enrichissement des profils LinkedIn pour les entreprises</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progression</span>
                    <span>68%</span>
                  </div>
                  <Progress value={68} className="h-2 bg-africa-sand-200">
                    <div className="h-full bg-africa-green rounded-full" style={{ width: '68%' }}></div>
                  </Progress>
                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-muted-foreground">112/165 entreprises</span>
                    <span className="text-muted-foreground">Commencé il y a 2h</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm">
                  Pause
                </Button>
                <Button variant="outline" size="sm">
                  Détails
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-white hover:bg-africa-sand-50 transition-colors">
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>Données financières</CardTitle>
                  <Badge className="bg-africa-earth">En cours</Badge>
                </div>
                <CardDescription>Récupération des données financières via API externe</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progression</span>
                    <span>22%</span>
                  </div>
                  <Progress value={22} className="h-2 bg-africa-sand-200">
                    <div className="h-full bg-africa-green rounded-full" style={{ width: '22%' }}></div>
                  </Progress>
                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-muted-foreground">46/210 entreprises</span>
                    <span className="text-muted-foreground">Commencé il y a 45min</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm">
                  Pause
                </Button>
                <Button variant="outline" size="sm">
                  Détails
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="sources" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white hover:bg-africa-sand-50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Layers className="h-5 w-5 mr-2 text-africa-green" />
                  LinkedIn API
                </CardTitle>
                <CardDescription>Données de profils d'entreprises</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                    Actif
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                    Profils
                  </Badge>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Récupération des données de profils LinkedIn pour obtenir des informations détaillées sur les entreprises.
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Key className="h-4 w-4 mr-1" />
                  API configurée
                </div>
                <Button variant="ghost" size="sm">
                  Configurer <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-white hover:bg-africa-sand-50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2 text-africa-earth" />
                  FinData API
                </CardTitle>
                <CardDescription>Données financières et investissements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                    Actif
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                    Finance
                  </Badge>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Accès aux données financières, levées de fonds et investissements des entreprises africaines.
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Key className="h-4 w-4 mr-1" />
                  API configurée
                </div>
                <Button variant="ghost" size="sm">
                  Configurer <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-white hover:bg-africa-sand-50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-africa-sand-900" />
                  OpenCorporates
                </CardTitle>
                <CardDescription>Registres de commerce officiels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                    Actif
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                    Légal
                  </Badge>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Informations légales et officielles sur les sociétés enregistrées à travers l'Afrique.
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Key className="h-4 w-4 mr-1" />
                  API configurée
                </div>
                <Button variant="ghost" size="sm">
                  Configurer <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-white hover:bg-africa-sand-50 transition-colors border-dashed border-2 flex flex-col items-center justify-center p-6">
              <PlusCircle className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="font-medium text-lg">Ajouter une source</h3>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Intégrer une nouvelle source de données pour enrichir vos entreprises
              </p>
              <Button variant="outline" className="mt-4">
                Configurer une API
              </Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des enrichissements</CardTitle>
              <CardDescription>Toutes les tâches d'enrichissement terminées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Enrichissement de contacts</p>
                    <p className="text-sm text-muted-foreground">95 entreprises enrichies</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-500">Terminé</Badge>
                    <p className="text-sm text-muted-foreground mt-1">Il y a 2 jours</p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Mise à jour des données financières</p>
                    <p className="text-sm text-muted-foreground">210 entreprises enrichies</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-500">Terminé</Badge>
                    <p className="text-sm text-muted-foreground mt-1">Il y a 1 semaine</p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Enrichissement des profils sociaux</p>
                    <p className="text-sm text-muted-foreground">155 entreprises enrichies</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-500">Terminé</Badge>
                    <p className="text-sm text-muted-foreground mt-1">Il y a 2 semaines</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                Voir tout l'historique
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
