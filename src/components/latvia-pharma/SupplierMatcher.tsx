'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Package, Building, FileSpreadsheet } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SupplierMatchResult {
  wholesalerName: string;
  wholesalerAddress: string;
  wholesalerLicense: string;
  manufacturerName: string;
  manufacturerCountry: string;
  products: Array<{
    drugName: string;
    dosageForm: string;
    concentration: string;
    registrationNumber: string;
    atcCode: string;
  }>;
}

export function SupplierMatcher() {
  const [activeSubstance, setActiveSubstance] = useState('');
  const [pharmaceuticalForm, setPharmaceuticalForm] = useState('');
  const [searchResults, setSearchResults] = useState<SupplierMatchResult[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierMatchResult | null>(null);

  const { data, isLoading: isSearching, refetch } = trpc.latviaPharma.findSuppliersForProduct.useQuery(
    {
      activeSubstance,
      pharmaceuticalForm: pharmaceuticalForm || undefined,
    },
    {
      enabled: false,
    }
  );

  React.useEffect(() => {
    if (data?.suppliers) {
      setSearchResults(data.suppliers);
    }
  }, [data]);

  const handleSearch = () => {
    if (!activeSubstance.trim()) {
      return;
    }
    
    // Trigger the query
    refetch();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Find Suppliers from Latvia Registry</CardTitle>
          <CardDescription>
            Search for wholesalers and manufacturers for your pharmaceutical products
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="activeSubstance">Active Substance *</Label>
              <Input
                id="activeSubstance"
                placeholder="e.g., Paracetamol, Ibuprofen"
                value={activeSubstance}
                onChange={(e) => setActiveSubstance(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pharmaceuticalForm">Pharmaceutical Form (Optional)</Label>
              <Input
                id="pharmaceuticalForm"
                placeholder="e.g., Tablets, Capsules, Solution"
                value={pharmaceuticalForm}
                onChange={(e) => setPharmaceuticalForm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          <Button 
            onClick={handleSearch} 
            disabled={isSearching || !activeSubstance.trim()}
            className="w-full md:w-auto"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search Suppliers
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Supplier Search Results</CardTitle>
            <CardDescription>
              Found {searchResults.length} supplier(s) for "{activeSubstance}"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Wholesaler</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((supplier, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {supplier.wholesalerName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {supplier.wholesalerLicense}
                        </Badge>
                      </TableCell>
                      <TableCell>{supplier.manufacturerName}</TableCell>
                      <TableCell>{supplier.manufacturerCountry}</TableCell>
                      <TableCell>
                        <Badge>{supplier.products.length} products</Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedSupplier(supplier)}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Supplier Details</DialogTitle>
                              <DialogDescription>
                                Products available from {supplier.wholesalerName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div className="grid gap-2">
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-semibold">Wholesaler:</span>
                                  {supplier.wholesalerName}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-semibold">Address:</span>
                                  {supplier.wholesalerAddress}
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-semibold">Available Products:</h4>
                                <div className="rounded-md border">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Drug Name</TableHead>
                                        <TableHead>Form</TableHead>
                                        <TableHead>Concentration</TableHead>
                                        <TableHead>ATC Code</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {supplier.products.map((product, idx) => (
                                        <TableRow key={idx}>
                                          <TableCell className="font-medium">
                                            {product.drugName}
                                          </TableCell>
                                          <TableCell>{product.dosageForm}</TableCell>
                                          <TableCell>
                                            {product.concentration || 'N/A'}
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant="outline">
                                              {product.atcCode}
                                            </Badge>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {searchResults.length === 0 && activeSubstance && !isSearching && (
        <Alert>
          <AlertDescription>
            No suppliers found for "{activeSubstance}". Try adjusting your search criteria or sync more data from the Latvia registry.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
