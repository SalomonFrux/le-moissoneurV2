import React, { useState } from 'react';
import { CloudUpload, Eye, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportService } from '@/services/exportService';

interface ExportHistory {
  id: string;
  date: string;
  format: string;
  size: string;
  status: 'completed' | 'failed' | 'in_progress';
}

export function ParametersPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [automatedExport, setAutomatedExport] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [fileNameTemplate, setFileNameTemplate] = useState('export-{date}-{format}');
  const [exportFrequency, setExportFrequency] = useState('daily');
  const [exportFields, setExportFields] = useState({
    companyName: true, // nom
    website: true,    // site_web
    country: true,    // pays
    sector: true,     // secteur
    description: true,// contenu
    email: true,      // email
    phone: true,      // telephone
    address: true,    // adresse
    link: true        // lien
  });
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  const getFormattedFileName = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    
    return fileNameTemplate
      .replace('{date}', date)
      .replace('{time}', time)
      .replace('{format}', selectedFormat);
  };

  const handleExportPreview = async () => {
    setIsLoading(true);
    try {
      const data = await exportService.getPreview({
        format: selectedFormat as 'csv' | 'xlsx',
        fields: exportFields,
        fileName: getFormattedFileName()
      });
      setPreviewData(data);
      setShowPreviewDialog(true);
      toast({
        title: "Aperçu généré",
        description: "Voici un aperçu des premières lignes de votre export."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer l'aperçu.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const { size } = await exportService.exportData({
        format: selectedFormat as 'csv' | 'xlsx',
        fields: exportFields,
        fileName: getFormattedFileName()
      });
      
      const newExport: ExportHistory = {
        id: Date.now().toString(),
        date: new Date().toLocaleString(),
        format: selectedFormat.toUpperCase(),
        size,
        status: 'completed'
      };
      setExportHistory(prev => [newExport, ...prev]);
      
      toast({
        title: "Export réussi",
        description: "Votre fichier a été exporté avec succès."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "L'export a échoué. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-start justify-between">
        <h2 className="text-3xl font-bold font-heading tracking-tight">Paramètres d'Export</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuration de l'export</CardTitle>
            <CardDescription>Paramètres généraux pour l'export des données</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="export-format">Format d'export</Label>
              <Select 
                value={selectedFormat} 
                onValueChange={setSelectedFormat}
              >
                <SelectTrigger id="export-format">
                  <SelectValue placeholder="Sélectionner un format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-name-template">Modèle de nom de fichier</Label>
              <Input
                id="file-name-template"
                placeholder="export-{date}-{format}"
                value={fileNameTemplate}
                onChange={(e) => setFileNameTemplate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Variables disponibles: {'{date}'}, {'{format}'}, {'{time}'}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="automated-export">Export automatique</Label>
              <Switch 
                id="automated-export"
                checked={automatedExport}
                onCheckedChange={setAutomatedExport}
              />
            </div>

            {automatedExport && (
              <div className="space-y-2">
                <Label htmlFor="export-frequency">Fréquence d'export</Label>
                <Select value={exportFrequency} onValueChange={setExportFrequency}>
                  <SelectTrigger id="export-frequency">
                    <SelectValue placeholder="Sélectionner une fréquence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidienne</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Champs à exporter</CardTitle>
            <CardDescription>Sélection des données à inclure dans les exports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-3">
                {Object.entries({
                  companyName: "Nom de l'entreprise",
                  website: "Site web",
                  country: "Pays",
                  sector: "Secteur d'activité",
                  description: "Description",
                  email: "Email",
                  phone: "Téléphone",
                  address: "Adresse",
                  link: "Lien source"
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`field-${key}`}
                      checked={exportFields[key as keyof typeof exportFields]}
                      onCheckedChange={(checked) => 
                        setExportFields(prev => ({ ...prev, [key]: checked === true }))
                      }
                    />
                    <Label htmlFor={`field-${key}`}>{label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Historique des exports</CardTitle>
            <CardDescription>Les derniers exports effectués</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">Date</th>
                    <th scope="col" className="px-6 py-3">Format</th>
                    <th scope="col" className="px-6 py-3">Taille</th>
                    <th scope="col" className="px-6 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {exportHistory.length === 0 ? (
                    <tr className="bg-white border-b">
                      <td colSpan={4} className="px-6 py-4 text-center">
                        Aucun export effectué
                      </td>
                    </tr>
                  ) : (
                    exportHistory.map((export_) => (
                      <tr key={export_.id} className="bg-white border-b">
                        <td className="px-6 py-4">{export_.date}</td>
                        <td className="px-6 py-4">{export_.format}</td>
                        <td className="px-6 py-4">{export_.size}</td>
                        <td className="px-6 py-4">
                          <span className={
                            export_.status === 'completed' ? 'text-green-600' :
                            export_.status === 'failed' ? 'text-red-600' :
                            'text-yellow-600'
                          }>
                            {export_.status === 'completed' ? 'Complété' :
                             export_.status === 'failed' ? 'Échoué' :
                             'En cours'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button 
          variant="outline" 
          onClick={handleExportPreview}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Eye className="mr-2 h-4 w-4" />
          )}
          Aperçu de l'export
        </Button>
        <Button
          onClick={handleExport}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CloudUpload className="mr-2 h-4 w-4" />
          )}
          Exporter maintenant
        </Button>
      </div>

      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aperçu de l'export</DialogTitle>
            <DialogDescription>
              Les 5 premières lignes de votre export
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {previewData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {previewData[0]?.map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(1).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-gray-500">
                Aucune donnée à afficher
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
