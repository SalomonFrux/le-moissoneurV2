import React, { useEffect, useState } from 'react';
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
import { fetchEnrichmentTasks } from '../../../../src/services/dataService';

export function EnrichmentPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      try {
        const data = await fetchEnrichmentTasks();
        setTasks(data);
      } catch (e) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  const activeTasks = tasks.filter(t => t.status === 'active');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const sources = [
    { name: 'LinkedIn API', type: 'Profils', status: 'Actif', icon: <Layers className="h-5 w-5 mr-2 text-africa-green" /> },
    { name: 'FinData API', type: 'Finance', status: 'Actif', icon: <Database className="h-5 w-5 mr-2 text-africa-earth" /> },
    { name: 'OpenCorporates', type: 'Légal', status: 'Actif', icon: <Settings className="h-5 w-5 mr-2 text-africa-sand-900" /> },
  ];

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
              <Badge className="bg-africa-green">{sources.length}</Badge>
            </CardTitle>
            <CardDescription>Sources de données pour enrichissement</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">100%</CardContent>
        </Card>
        <Card className="bg-white border-africa-sand-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between">
              <span>Tâches en cours</span>
              <Badge className="bg-africa-earth">{activeTasks.length}</Badge>
            </CardTitle>
            <CardDescription>Enrichissements actifs</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            <div className="flex items-center">
              <span>{activeTasks.length > 0 ? 'En cours' : '0%'}</span>
              {activeTasks.length > 0 && (
                <RefreshCw className="ml-2 h-4 w-4 animate-spin text-africa-earth" />
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-africa-sand-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between">
              <span>Données enrichies</span>
              <Badge className="bg-africa-sand-500">{completedTasks.length}</Badge>
            </CardTitle>
            <CardDescription>Entreprises enrichies</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{completedTasks.length > 0 ? '62%' : '0%'}</CardContent>
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
            {loading ? (
              <Card><CardContent>Chargement...</CardContent></Card>
            ) : activeTasks.length === 0 ? (
              <Card><CardContent>Aucune tâche active</CardContent></Card>
            ) : (
              activeTasks.map(task => (
                <Card key={task.id} className="bg-white hover:bg-africa-sand-50 transition-colors">
                  <CardHeader>
                    <div className="flex justify-between">
                      <CardTitle>{task.title}</CardTitle>
                      <Badge className="bg-africa-earth">En cours</Badge>
                    </div>
                    <CardDescription>{task.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progression</span>
                        <span>{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-2 bg-africa-sand-200">
                        <div className="h-full bg-africa-green rounded-full" style={{ width: `${task.progress}%` }}></div>
                      </Progress>
                      <div className="flex justify-between text-sm pt-2">
                        <span className="text-muted-foreground">{task.done}/{task.total} entreprises</span>
                        <span className="text-muted-foreground">{task.startedAgo}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">Pause</Button>
                    <Button variant="outline" size="sm">Détails</Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="sources" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sources.map((src, i) => (
              <Card key={src.name} className="bg-white hover:bg-africa-sand-50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center">{src.icon}{src.name}</CardTitle>
                  <CardDescription>{src.type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">{src.status}</Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">{src.type}</Badge>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {/* Add more info if available */}
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
            ))}
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
                {loading ? (
                  <div>Chargement...</div>
                ) : completedTasks.length === 0 ? (
                  <div>Aucun historique</div>
                ) : (
                  completedTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between py-3 border-b">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">{task.done} entreprises enrichies</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-500">Terminé</Badge>
                        <p className="text-sm text-muted-foreground mt-1">{task.completedAgo}</p>
                      </div>
                    </div>
                  ))
                )}
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
