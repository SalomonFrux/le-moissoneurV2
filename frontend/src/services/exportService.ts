import { saveAs } from 'file-saver';
import axios from 'axios';
import { authService } from './authService';

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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const exportService = {
  async getPreview(config: ExportConfig): Promise<string[][]> {
    try {
      const response = await axios.post(`${API_URL}/api/export/preview`, config, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (!response.data) {
        throw new Error('No data received from server');
      }

      return response.data;
    } catch (error) {
      console.error('Preview error:', error);
      throw new Error('Failed to get export preview');
    }
  },

  async exportData(config: ExportConfig): Promise<{ size: string }> {
    try {
      const response = await axios.post(`${API_URL}/api/export/download`, config, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] 
      });
      
      const contentDisposition = response.headers['content-disposition'];
      const fileName = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : config.fileName;

      saveAs(blob, fileName);

      return {
        size: (blob.size / (1024 * 1024)).toFixed(2) + ' MB'
      };
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('Export failed');
    }
  }
};
