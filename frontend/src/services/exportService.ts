import { saveAs } from 'file-saver';

interface ExportFields {
  companyName: boolean; // nom
  website: boolean;    // site_web
  country: boolean;    // pays
  sector: boolean;     // secteur
  description: boolean;// contenu
  email: boolean;      // email
  phone: boolean;      // telephone
  address: boolean;    // adresse
  link: boolean;       // lien
}

interface ExportConfig {
  format: 'csv' | 'xlsx';
  fields: ExportFields;
  fileName: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const exportService = {
  async getPreview(config: ExportConfig): Promise<string[][]> {
    const response = await fetch(`${API_URL}/api/export/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to get export preview');
    }

    return response.json();
  },

  async exportData(config: ExportConfig): Promise<{ size: string }> {
    const response = await fetch(`${API_URL}/api/export/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('content-disposition');
    const fileName = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : config.fileName;

    saveAs(blob, fileName);

    return {
      size: (blob.size / (1024 * 1024)).toFixed(2) + ' MB'
    };
  }
};
