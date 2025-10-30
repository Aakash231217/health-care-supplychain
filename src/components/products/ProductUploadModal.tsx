'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';

interface ProductUploadModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProductUploadModal({ open, onClose }: ProductUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const bulkUploadMutation = trpc.product.bulkUpload.useMutation({
    onSuccess: () => {
      toast({
        title: "Success!",
        description: `${parsedData.length} products uploaded successfully`,
      });
      setFile(null);
      setParsedData([]);
      onClose();
    },
    onError: (error: { message: any; }) => {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      parseFile(uploadedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  });

  const parseFile = async (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        // Map to expected format
        const mapped = json.map((row: any) => ({
          sku: row.SKU || row.sku || '',
          name: row.Name || row.name || row.ProductName || '',
          description: row.Description || row.description || '',
          category: row.Category || row.category || 'Uncategorized',
          subCategory: row.SubCategory || row.subCategory || '',
          unitOfMeasure: row.UnitOfMeasure || row.unit || 'Unit',
          reorderPoint: parseInt(row.ReorderPoint || row.reorderPoint) || undefined,
          leadTime: parseInt(row.LeadTime || row.leadTime) || undefined,
        }));

        setParsedData(mapped.filter(item => item.sku && item.name));
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Parse error",
          description: "Failed to parse file. Please check the format.",
        });
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) return;

    setUploading(true);
    try {
      await bulkUploadMutation.mutateAsync({ products: parsedData });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setParsedData([]);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Upload Products</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Upload Area */}
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-primary'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">
                {isDragActive ? 'Drop file here' : 'Drag & drop your file here'}
              </p>
              <p className="text-sm text-gray-500 mb-4">or click to browse</p>
              <p className="text-xs text-gray-400">Supports: CSV, XLS, XLSX</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={removeFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Parse Results */}
              {parsedData.length > 0 ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <p className="font-medium text-green-900">
                      File parsed successfully
                    </p>
                  </div>
                  <p className="text-sm text-green-700">
                    {parsedData.length} products ready to upload
                  </p>
                  
                  {/* Preview */}
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Preview (first 3 rows):</p>
                    <div className="bg-white rounded border text-xs overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">SKU</th>
                            <th className="text-left p-2">Name</th>
                            <th className="text-left p-2">Category</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.slice(0, 3).map((item, idx) => (
                            <tr key={idx} className="border-b last:border-0">
                              <td className="p-2">{item.sku}</td>
                              <td className="p-2">{item.name}</td>
                              <td className="p-2">{item.category}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm text-yellow-900">
                      Parsing file... Please wait
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={parsedData.length === 0 || uploading}
            >
              {uploading ? 'Uploading...' : `Upload ${parsedData.length} Products`}
            </Button>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">
              Required columns:
            </p>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>SKU - Unique product identifier</li>
              <li>Name - Product name</li>
              <li>Category - Product category</li>
              <li>UnitOfMeasure - Unit (e.g., Box, Unit, Bottle)</li>
            </ul>
            <p className="text-xs text-blue-700 mt-2">
              Optional: Description, SubCategory, ReorderPoint, LeadTime
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
