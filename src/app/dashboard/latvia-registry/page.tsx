'use client';

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeft, Building, Pill, Package, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { LatviaPharmaSyncButton } from "@/components/latvia-pharma/LatviaPharmaSyncButton";

export default function LatviaRegistryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWholesaler, setSelectedWholesaler] = useState<string>("");

  // Search Latvia registry
  const { data, isLoading } = trpc.latviaPharma.searchLatviaRegistry.useQuery({
    query: searchTerm,
    limit: 100,
  });

  const products = data?.results || [];

  // Get unique wholesalers for filter
  const wholesalers = Array.from(new Set(products.map((p: any) => p.wholesalerName))).sort();

  // Filter products
  const filteredProducts = products.filter((product: any) => {
    if (selectedWholesaler && product.wholesalerName !== selectedWholesaler) {
      return false;
    }
    return true;
  });

  // Group by ATC code for summary
  const atcGroups = filteredProducts.reduce<Record<string, number>>((acc, product: any) => {
    const atc = product.atcCode?.charAt(0) || 'U';
    acc[atc] = (acc[atc] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Pill className="h-6 w-6" />
                Latvia Pharmaceutical Registry
              </h1>
              <p className="text-sm text-gray-600">Search and explore pharmaceutical data from Latvia</p>
            </div>
            <LatviaPharmaSyncButton />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-primary opacity-80" />
                  <div>
                    <p className="text-2xl font-bold">{products.length}</p>
                    <p className="text-sm text-gray-600">Total Products</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Building className="h-8 w-8 text-blue-600 opacity-80" />
                  <div>
                    <p className="text-2xl font-bold">{wholesalers.length}</p>
                    <p className="text-sm text-gray-600">Wholesalers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {Object.entries(atcGroups).slice(0, 2).map(([atc, count]) => (
              <Card key={atc}>
                <CardContent className="p-6">
                  <div>
                    <Badge className="mb-2">ATC {atc}</Badge>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-gray-600 truncate">
                      {getATCName(atc)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by drug name, active ingredient, or ATC code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select 
                  value={selectedWholesaler}
                  onChange={(e) => setSelectedWholesaler(e.target.value)}
                  className="px-4 py-2 border rounded-md"
                >
                  <option value="">All Wholesalers</option>
                  {wholesalers.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>
                {filteredProducts.length} products found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Drug Name</TableHead>
                        <TableHead>Active Ingredient</TableHead>
                        <TableHead>ATC</TableHead>
                        <TableHead>Manufacturer</TableHead>
                        <TableHead>Wholesaler</TableHead>
                        <TableHead>License</TableHead>
                        <TableHead>Valid Until</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product: any) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.drugName}</div>
                              <div className="text-sm text-gray-500">{product.dosageForm}</div>
                              <code className="text-xs text-gray-400">{product.registrationNumber}</code>
                            </div>
                          </TableCell>
                          <TableCell>{product.activeIngredient}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.atcCode}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{product.manufacturerName}</div>
                              <div className="text-gray-500">{product.manufacturerCountry}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Link 
                              href={`/dashboard/vendors?search=${encodeURIComponent(product.wholesalerName)}`}
                              className="text-blue-600 hover:underline"
                            >
                              {product.wholesalerName}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs">{product.wholesalerLicense}</code>
                          </TableCell>
                          <TableCell className="text-sm">{product.permitValidity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function getATCName(code: string): string {
  const names: Record<string, string> = {
    A: 'Alimentary & metabolism',
    B: 'Blood & blood forming',
    C: 'Cardiovascular',
    D: 'Dermatologicals',
    G: 'Genito-urinary',
    H: 'Hormonal',
    J: 'Anti-infectives',
    L: 'Antineoplastic',
    M: 'Musculo-skeletal',
    N: 'Nervous system',
    P: 'Antiparasitic',
    R: 'Respiratory',
    S: 'Sensory organs',
    V: 'Various',
  };
  return names[code] || 'Unknown';
}
