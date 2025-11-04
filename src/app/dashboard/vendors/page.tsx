'use client';

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search, Plus, ArrowLeft, Star, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function VendorsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch vendors from database using TRPC
  const { data, isLoading, error } = trpc.vendor.getAll.useQuery({
    limit: 100,
  });

  const vendors = data?.vendors || [];

  // Count purchase orders for each vendor (using vendorPrices as proxy for now)
  const vendorsWithOrders = vendors.map(vendor => ({
    ...vendor,
    totalOrders: vendor.purchaseOrders?.length || 0,
    performanceRating: vendor.performanceRating || 0,
    qualityScore: vendor.qualityScore ? Math.round(vendor.qualityScore * 20) : 0, // Convert 0-5 to percentage
  }));

  const filteredVendors = vendorsWithOrders.filter((vendor) =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Vendor Management</h1>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatCard title="Total Vendors" value={vendors.length.toString()} trend={`${vendors.filter(v => v.status === 'ACTIVE').length} active`} />
            <StatCard title="Avg Performance" value={`${(vendorsWithOrders.reduce((sum, v) => sum + v.performanceRating, 0) / vendorsWithOrders.length || 0).toFixed(1)}/5`} trend="⭐ Performance" />
            <StatCard title="With Certifications" value={vendors.filter(v => v.certifications).length.toString()} trend="Verified suppliers" />
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search vendors by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">Filters</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vendors</CardTitle>
              <CardDescription>
                {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : error ? (
                <div className="text-center p-8 text-red-600">
                  Error loading vendors: {error.message}
                </div>
              ) : filteredVendors.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  {searchTerm ? 'No vendors found matching your search.' : 'No vendors found. Click "Add Vendor" to create one.'}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Quality Score</TableHead>
                      <TableHead>Certifications</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{vendor.email}</div>
                            <div className="text-gray-500">{vendor.phone || 'No phone'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{vendor.performanceRating.toFixed(1)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-2 max-w-[60px]">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${vendor.qualityScore}%` }}
                              />
                            </div>
                            <span className="text-sm">{vendor.qualityScore}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {vendor.certifications ? (
                            <div className="text-sm">
                              <span className="font-medium text-green-600">✓ Verified</span>
                              {(vendor.certifications as any)?.latviaLicense && (
                                <div className="text-xs text-gray-500">
                                  {(vendor.certifications as any).latviaLicense}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={vendor.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/vendors/${vendor.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, trend }: { title: string; value: string; trend: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold mb-2">{value}</p>
        <p className="text-xs text-gray-500">{trend}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    BLACKLISTED: "bg-red-100 text-red-800",
    UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
