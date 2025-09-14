'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { exportCSV } from '@/lib/actions/csv';
import { Download } from 'lucide-react';

interface CSVExportProps {
  searchParams: Record<string, string | undefined>;
}

export default function CSVExport({ searchParams }: CSVExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const result = await exportCSV(searchParams);
      
      // Create and download the file
      const blob = new Blob([result.content], { type: result.contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleExport} 
      disabled={isExporting}
    >
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? 'Exporting...' : 'Export CSV'}
    </Button>
  );
}
