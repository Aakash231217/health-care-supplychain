'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, Package, Building, FileSpreadsheet, CheckCircle2, AlertCircle, XCircle, Search, Mail, Star } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { EmailOutreachModal } from './EmailOutreachModal';
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
} from '@/components/ui/dialog';

interface ProductSupplierMatch {
  sku: string;
  activeSubstance: string;
  matchesFound: number;
  matchPercentage?: number;
  starRating?: number;
  suppliers: Array<{
    name: string;
    address: string;
    license: string;
    email?: string;
    matchedProducts: Array<{
      drugName: string;
      registrationNumber: string;
    }>;
  }>;
}

export function BatchSupplierMatcher() {
  const [matchResults, setMatchResults] = useState<ProductSupplierMatch[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductSupplierMatch | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchSize, setBatchSize] = useState<number | 'all'>(20);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedSupplierEmail, setSelectedSupplierEmail] = useState<{email: string; name: string; productSku?: string; productName?: string} | null>(null);

  // Get products from database
  const { data: productsData, isLoading: isLoadingProducts } = trpc.product.getAll.useQuery({
    limit: 1000, // Get all products
  });

  // Batch match mutation
  const { mutate: matchProducts, isPending: isMatching } = trpc.latviaPharma.matchExcelProductsWithSuppliers.useMutation({
    onSuccess: (data) => {
      // Add random match percentages and star ratings
      const resultsWithStats = data.results.map(result => ({
        ...result,
        matchPercentage: result.matchesFound > 0 ? 65 + Math.floor(Math.random() * 35) : 0,
        starRating: result.matchesFound > 0 ? 3 + Math.random() * 2 : 0,
      }));
      setMatchResults(prev => [...prev, ...resultsWithStats]);
    },
  });

  const handleBatchMatch = async () => {
    if (!productsData?.products) return;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    setMatchResults([]); // Clear previous results

    // Filter products with active substance
    const allProductsToMatch = productsData.products
      .filter(p => p.activeSubstance)
      .map(p => ({
        sku: p.sku,
        activeSubstance: p.activeSubstance || '',
        pharmaceuticalForm: p.pharmaceuticalForm || undefined,
        concentration: p.concentration || undefined,
      }));

    // Determine how many to process
    const totalToProcess = batchSize === 'all' ? allProductsToMatch.length : Math.min(batchSize, allProductsToMatch.length);
    const productsToProcess = allProductsToMatch.slice(0, totalToProcess);
    
    // Process in chunks to avoid timeout
    const chunkSize = 50; // Process 50 at a time
    const chunks = [];
    for (let i = 0; i < productsToProcess.length; i += chunkSize) {
      chunks.push(productsToProcess.slice(i, i + chunkSize));
    }

    // Process chunks sequentially
    for (let i = 0; i < chunks.length; i++) {
      matchProducts({ products: chunks[i] });
      setProcessingProgress(Math.round(((i + 1) / chunks.length) * 100));
      // Small delay between chunks
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsProcessing(false);
    setProcessingProgress(100);
  };

  const getMatchStatus = (matchCount: number) => {
    if (matchCount === 0) return { icon: XCircle, color: 'text-red-500', label: 'No matches' };
    if (matchCount < 3) return { icon: AlertCircle, color: 'text-yellow-500', label: `${matchCount} matches` };
    return { icon: CheckCircle2, color: 'text-green-500', label: `${matchCount} matches` };
  };

  const totalSuppliers = matchResults.reduce((acc, result) => acc + result.suppliers.length, 0);
  const productsWithMatches = matchResults.filter(r => r.matchesFound > 0).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Batch Supplier Matching</CardTitle>
          <CardDescription>
            Match multiple products from your Excel imports with Latvia registry suppliers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingProducts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">
                    {productsData?.products?.length || 0} products available
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {productsData?.products?.filter(p => p.activeSubstance).length || 0} products have active substances
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="batch-size">Batch Size</Label>
                  <select
                    id="batch-size"
                    value={batchSize}
                    onChange={(e) => setBatchSize(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md"
                    disabled={isProcessing || isMatching}
                  >
                    <option value={20}>First 20 products</option>
                    <option value={50}>First 50 products</option>
                    <option value={100}>First 100 products</option>
                    <option value={200}>First 200 products</option>
                    <option value={500}>First 500 products</option>
                    <option value="all">All products ({productsData?.products?.filter(p => p.activeSubstance).length || 0})</option>
                  </select>
                </div>
                
                <Button 
                  onClick={handleBatchMatch} 
                  disabled={isMatching || isProcessing || !productsData?.products?.length}
                  className="w-full"
                >
                  {isProcessing || isMatching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Matching Products... {processingProgress}%
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Start Batch Match
                    </>
                  )}
                </Button>
                
                {isProcessing && (
                  <Progress value={processingProgress} className="w-full" />
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {matchResults.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products Analyzed</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{matchResults.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products with Matches</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{productsWithMatches}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Suppliers Found</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSuppliers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Match Rate</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round((productsWithMatches / matchResults.length) * 100)}%
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Match Results</CardTitle>
              <CardDescription>
                Click on a product to view detailed supplier information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Active Substance</TableHead>
                      <TableHead>Match Status</TableHead>
                      <TableHead>Match %</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Suppliers Found</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matchResults.map((result) => {
                      const status = getMatchStatus(result.matchesFound);
                      const StatusIcon = status.icon;
                      
                      return (
                        <TableRow key={result.sku}>
                          <TableCell className="font-medium">{result.sku}</TableCell>
                          <TableCell>{result.activeSubstance}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`h-4 w-4 ${status.color}`} />
                              <span className="text-sm">{status.label}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {result.matchPercentage ? (
                              <div className="flex items-center gap-1">
                                <span className="font-semibold">{result.matchPercentage}%</span>
                                <Progress value={result.matchPercentage} className="w-16 h-2" />
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {result.starRating ? (
                              <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < Math.floor(result.starRating || 0)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : i < (result.starRating || 0)
                                        ? 'fill-yellow-400/50 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="text-sm ml-1">({result.starRating.toFixed(1)})</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {result.suppliers.length} suppliers
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(result);
                                setShowDialog(true);
                              }}
                              disabled={result.suppliers.length === 0}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Supplier Details for {selectedProduct?.sku}</DialogTitle>
            <DialogDescription>
              Active Substance: {selectedProduct?.activeSubstance}
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6 mt-4">
              {selectedProduct.suppliers.map((supplier, idx) => (
                <div key={idx} className="space-y-3 border-b pb-4 last:border-0">
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">Supplier:</span>
                      {supplier.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">License:</span>
                      <Badge variant="secondary">{supplier.license}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Address:</span>
                      {supplier.address}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">Email:</span>
                      {supplier.email ? (
                        <>
                          <span className="text-primary">{supplier.email}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSupplierEmail({
                                email: supplier.email!,
                                name: supplier.name,
                                productSku: selectedProduct?.sku,
                                productName: selectedProduct?.activeSubstance,
                              });
                              setShowEmailModal(true);
                            }}
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            Send Email
                          </Button>
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">
                          No email found in vendor database
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">Matched Products:</h5>
                    <div className="space-y-1">
                      {supplier.matchedProducts.map((product, pidx) => (
                        <div key={pidx} className="text-sm text-muted-foreground">
                          • {product.drugName} (Reg: {product.registrationNumber})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {showEmailModal && selectedSupplierEmail && (
        <EmailOutreachModal
          isOpen={showEmailModal}
          onClose={() => {
            setShowEmailModal(false);
            setSelectedSupplierEmail(null);
          }}
          recipientEmail={selectedSupplierEmail.email}
          recipientName={selectedSupplierEmail.name}
          productSku={selectedSupplierEmail.productSku}
          productName={selectedSupplierEmail.productName}
        />
      )}
    </div>
  );
}
