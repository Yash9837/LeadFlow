'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { importCSV } from '@/lib/actions/csv';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

interface CSVImportProps {
  onImportComplete: () => void;
}

export default function CSVImport({ onImportComplete }: CSVImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setMessage({ type: 'error', text: 'Please select a CSV file.' });
        return;
      }
      setSelectedFile(file);
      setMessage(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      console.log('Starting CSV import...');
      const result = await importCSV(formData);
      console.log('CSV import result:', result);
      
      setMessage({
        type: 'success',
        text: result.message,
      });

      // Reset form
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Close modal after a delay
      setTimeout(() => {
        setIsOpen(false);
        onImportComplete();
      }, 2000);
    } catch (error) {
      console.error('CSV import error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to import CSV',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedFile(null);
    setMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) {
    return (
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <Upload className="h-4 w-4 mr-2" />
        Import CSV
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Import CSV</CardTitle>
              <CardDescription>
                Upload a CSV file to import buyer leads
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="csv-file" className="block text-sm font-medium mb-2">
              Select CSV File
            </label>
            <input
              ref={fileInputRef}
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center">
                <Upload className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">{selectedFile.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {message && (
            <div className={`flex items-center p-3 rounded ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-2" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          <div className="text-xs text-gray-500">
            <p><strong>CSV Format Requirements:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Maximum 200 rows per import</li>
              <li>Required fields: Full Name, Phone, City, Property Type, Purpose, Timeline, Source</li>
              <li>Optional fields: Email, BHK (required for Apartment/Villa), Budget Min/Max, Notes, Tags</li>
              <li>File size limit: 5MB</li>
            </ul>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
              className="flex-1"
            >
              {isImporting ? 'Importing...' : 'Import'}
            </Button>
            <Button variant="outline" onClick={handleClose} disabled={isImporting}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
