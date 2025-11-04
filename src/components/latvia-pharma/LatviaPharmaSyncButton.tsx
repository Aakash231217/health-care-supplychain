'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { trpc } from '@/lib/trpc/client';
import { RefreshCw, AlertCircle } from 'lucide-react';

export function LatviaPharmaSyncButton() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const syncMutation = trpc.latviaPharma.syncLatviaData.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Sync completed",
        description: `Successfully synced ${data.syncedRecords} of ${data.totalRecords} records`,
        variant: data.failedRecords > 0 ? "default" : "default",
      });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
      setOpen(false);
    },
  });
  
  const handleSync = () => {
    syncMutation.mutate({
      pageSize: 50,
      maxPages: 5, // Start with 5 pages for testing
    });
  };
  
  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setOpen(true)}
        disabled={syncMutation.isPending}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
        Sync Latvia Registry
      </Button>
      
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sync Latvia Pharmaceutical Registry</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4">
                <p>
                  This will fetch pharmaceutical data from the Latvia drug registry 
                  including manufacturer information, ATC codes, and wholesaler details.
                </p>
                
                <div className="bg-amber-50 p-3 rounded-lg flex gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Note:</p>
                    <p>This process may take several minutes depending on the amount of data.</p>
                  </div>
                </div>
                
                {syncMutation.isPending && (
                  <div className="text-sm text-gray-600 animate-pulse">
                    Syncing data, please wait...
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={syncMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSync}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Start Sync'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
