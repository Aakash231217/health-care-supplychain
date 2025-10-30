'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  Loader2
} from 'lucide-react';

export function ExcelUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    totalRecords: number;
    successRecords: number;
    failedRecords: number;
    errors: string[];
  } | null>(null);
  const { toast } = useToast();

  const uploadMutation = trpc.import.uploadPharmaceuticalExcel.useMutation({
    onSuccess: (data) => {
      setUploadResult(data);
      toast({
        title: "Import completed",
        description: `Successfully imported ${data.successRecords} of ${data.totalRecords} products`,
        variant: data.failedRecords > 0 ? "default" : "default",
      });
      setIsUploading(false);
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Content = base64.split(',')[1]; // Remove data:application/vnd... prefix

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        // Upload file
        await uploadMutation.mutateAsync({
          fileName: file.name,
          fileContent: base64Content,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const downloadTemplate = () => {
    // In a real app, this would download a template Excel file
    toast({
      title: "Template download",
      description: "Excel template download would be implemented here",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Import Pharmaceutical Products</h3>
          <p className="text-sm text-gray-600">
            Upload an Excel file containing pharmaceutical product data with vendor pricing information.
          </p>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          
          {isUploading ? (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
              <p className="text-sm font-medium">Processing Excel file...</p>
              <Progress value={uploadProgress} className="max-w-xs mx-auto" />
            </div>
          ) : (
            <>
              <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              {isDragActive ? (
                <p className="text-primary font-medium">Drop the Excel file here...</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-600">Drag and drop an Excel file here</p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            disabled={isUploading}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          
          <p className="text-xs text-gray-500">
            Supported formats: .xlsx, .xls
          </p>
        </div>
      </Card>

      {uploadResult && (
        <Card className="p-6">
          <div className="flex items-start space-x-4">
            {uploadResult.failedRecords === 0 ? (
              <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-8 w-8 text-orange-500 flex-shrink-0" />
            )}
            
            <div className="flex-1">
              <h4 className="font-semibold mb-2">Import Results</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Records:</span>
                  <span className="font-medium">{uploadResult.totalRecords}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Successfully Imported:</span>
                  <span className="font-medium text-green-600">{uploadResult.successRecords}</span>
                </div>
                {uploadResult.failedRecords > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Failed:</span>
                    <span className="font-medium text-red-600">{uploadResult.failedRecords}</span>
                  </div>
                )}
              </div>

              {uploadResult.errors.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-red-600 mb-2">Errors:</p>
                  <div className="bg-red-50 rounded p-3 max-h-32 overflow-y-auto">
                    {uploadResult.errors.map((error, index) => (
                      <p key={index} className="text-xs text-red-700">
                        • {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
