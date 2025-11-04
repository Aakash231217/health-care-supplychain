'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc/client';
import { Loader2, Search, Package, Building2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function LatviaWholesalersTable() {
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading } = trpc.latviaPharma.getWholesalersList.useQuery({
    limit: pageSize,
    offset: page * pageSize,
  });

  const researchMutation = trpc.latviaPharma.researchLatviaWholesaler.useMutation({
    onSuccess: (data) => {
      toast.success('Wholesaler research completed!', {
        description: `${data.vendor.name} - ${data.intelligence.supplierClassification}`,
      });
      // Refresh the list
      utils.latviaPharma.getWholesalersList.invalidate();
    },
    onError: (error) => {
      toast.error('Research failed', {
        description: error.message,
      });
    },
  });

  const utils = trpc.useUtils();

  const handleResearch = (wholesalerName: string, wholesalerAddress: string) => {
    researchMutation.mutate({
      wholesalerName,
      wholesalerAddress,
    });
  };

  const getClassificationBadge = (classification?: string | null) => {
    if (!classification) return null;

    const colors = {
      'Bulk Supplier': 'bg-green-100 text-green-800',
      'Mid-size Distributor': 'bg-blue-100 text-blue-800',
      'Small Retailer': 'bg-yellow-100 text-yellow-800',
    };

    return (
      <Badge className={colors[classification as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {classification}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data || data.wholesalers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Wholesalers Found</h3>
          <p className="text-sm text-gray-500">
            Run the Latvia registry sync first to populate wholesaler data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Latvia Wholesalers
            </span>
            <Badge variant="outline">{data.total} total</Badge>
          </CardTitle>
          <CardDescription>
            Pharmaceutical wholesalers from Latvia registry with automated research capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wholesaler Name</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.wholesalers.map((wholesaler, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{wholesaler.wholesalerName}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">
                          {wholesaler.wholesalerAddress}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-gray-600">
                        {wholesaler.wholesalerLicense}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="gap-1">
                        <Package className="h-3 w-3" />
                        {wholesaler.productCount}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {wholesaler.intelligence?.supplierClassification ? (
                        getClassificationBadge(wholesaler.intelligence.supplierClassification)
                      ) : (
                        <span className="text-sm text-gray-400">Not researched</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {wholesaler.hasBeenResearched ? (
                        <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
                          <CheckCircle2 className="h-3 w-3" />
                          Researched
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          New
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleResearch(wholesaler.wholesalerName, wholesaler.wholesalerAddress)
                        }
                        disabled={researchMutation.isLoading}
                        className="gap-2"
                      >
                        <Search className="h-3 w-3" />
                        {wholesaler.hasBeenResearched ? 'Re-research' : 'Research'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, data.total)} of{' '}
              {data.total} wholesalers
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!data.hasMore}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
