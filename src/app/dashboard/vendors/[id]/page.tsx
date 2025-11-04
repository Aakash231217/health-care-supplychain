'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Building, Mail, Phone, MapPin, Shield, Package, Pill, Factory, Calendar, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Loader2 } from "lucide-react";

export default function VendorDetailPage() {
  const params = useParams();
  const vendorId = params.id as string;

  // Fetch vendor details
  const { data: vendor, isLoading: vendorLoading } = trpc.vendor.getById.useQuery({ 
    id: vendorId 
  });

  // Fetch all products supplied by this vendor from Latvia registry
  const { data: latviaProducts, isLoading: productsLoading } = trpc.latviaPharma.getProductsByWholesaler.useQuery({
    wholesalerName: vendor?.name || ''
  }, {
    enabled: !!vendor?.name
  });

  if (vendorLoading || productsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg">Vendor not found</p>
        </div>
      </div>
    );
  }

  const products = latviaProducts?.products || [];

  // Group products by ATC code
  const productsByATC = products.reduce<Record<string, typeof products>>((acc, product) => {
    const atc = product.atcCode || 'Unknown';
    if (!acc[atc]) acc[atc] = [];
    acc[atc].push(product);
    return acc;
  }, {});

  // Get unique manufacturers
  const manufacturers = Array.from(new Set(products.map(p => p.manufacturerName)));

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard/vendors">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Vendors
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Building className="h-6 w-6" />
                {vendor.name}
              </h1>
              {vendor.certifications && (
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  Latvia Registry Verified • License: {(vendor.certifications as any).latviaLicense}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Edit Vendor</Button>
              <Button>Create Order</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Vendor Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>{vendor.email}</p>
                  {vendor.phone && (
                    <p className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {vendor.phone}
                    </p>
                  )}
                  {vendor.address && (
                    <p className="flex items-start gap-1">
                      <MapPin className="h-3 w-3 mt-0.5" />
                      {vendor.address}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Supply Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-2xl font-bold">{products.length}</p>
                    <p className="text-sm text-gray-600">Total Products</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="font-medium">{Object.keys(productsByATC).length}</p>
                      <p className="text-xs text-gray-600">ATC Categories</p>
                    </div>
                    <div>
                      <p className="font-medium">{manufacturers.length}</p>
                      <p className="text-xs text-gray-600">Manufacturers</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Quality Score</span>
                      <span className="text-sm font-medium">{Math.round((vendor.qualityScore || 0) * 20)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${Math.round((vendor.qualityScore || 0) * 20)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Responsiveness</span>
                      <span className="text-sm font-medium">{Math.round((vendor.responsivenessScore || 0) * 20)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.round((vendor.responsivenessScore || 0) * 20)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Pharmaceutical Products Supplied
              </CardTitle>
              <CardDescription>
                All medicines available from {vendor.name} according to Latvia Pharmaceutical Registry
              </CardDescription>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No products found in Latvia registry for this vendor
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(productsByATC).map(([atcCode, atcProducts]) => (
                    <div key={atcCode} className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          ATC: {atcCode}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {getATCDescription(atcCode)}
                        </span>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Drug Name</TableHead>
                            <TableHead>Active Ingredient</TableHead>
                            <TableHead>Dosage Form</TableHead>
                            <TableHead>Manufacturer</TableHead>
                            <TableHead>Registration</TableHead>
                            <TableHead>Valid Until</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {atcProducts.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">
                                {product.drugName}
                              </TableCell>
                              <TableCell>
                                {product.activeIngredient}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-600">
                                  {product.dosageForm}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">{product.manufacturerName}</div>
                                  <div className="text-gray-500">{product.manufacturerCountry}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                                  {product.registrationNumber}
                                </code>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm">
                                  <Calendar className="h-3 w-3" />
                                  {product.permitValidity}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function getATCDescription(code: string): string {
  const firstLetter = code.charAt(0);
  const categories: Record<string, string> = {
    A: 'Alimentary tract and metabolism',
    B: 'Blood and blood forming organs',
    C: 'Cardiovascular system',
    D: 'Dermatologicals',
    G: 'Genito-urinary system',
    H: 'Systemic hormonal preparations',
    J: 'Anti-infectives',
    L: 'Antineoplastic agents',
    M: 'Musculo-skeletal system',
    N: 'Nervous system',
    P: 'Antiparasitic products',
    R: 'Respiratory system',
    S: 'Sensory organs',
    V: 'Various',
  };
  return categories[firstLetter] || 'Unknown category';
}
