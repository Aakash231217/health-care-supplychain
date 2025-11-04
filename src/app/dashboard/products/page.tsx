'use client';

import { AwaitedReactNode, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Upload, Search, Plus, ArrowLeft } from "lucide-react";
import { ProductUploadModal } from "@/components/products/ProductUploadModal";
import { MedicineVendorSearchModal } from "@/components/products/MedicineVendorSearchModal";
import { LatviaPharmaSyncButton } from "@/components/latvia-pharma/LatviaPharmaSyncButton";
import { Pagination } from "@/components/ui/pagination";
import { trpc } from "@/lib/trpc/client";

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Fetch products using tRPC with pagination
  const { data, isLoading } = trpc.product.getAllPaginated.useQuery({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
  });

  const products = data?.products || [];
  const pagination = data?.pagination;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
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
              <Package className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Product Management</h1>
            </div>
            <div className="flex gap-2">
              <LatviaPharmaSyncButton />
              <Link href="/dashboard/suppliers">
                <Button variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Find Suppliers
                </Button>
              </Link>
              <Button onClick={() => setUploadModalOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Products
              </Button>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products by name or SKU..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1); // Reset to first page on search
                    }}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">Filters</Button>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Products</CardTitle>
                <CardDescription>
                  {pagination ? (
                    <>
                      Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, pagination.totalCount)} of {pagination.totalCount} products
                    </>
                  ) : (
                    'Loading...'
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
                <span className="text-sm text-gray-600">per page</span>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading products...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No products found. {searchTerm ? 'Try a different search term.' : 'Upload your first product catalog to get started.'}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Compliance</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product: { id: Key | null | undefined; sku: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; name: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; category: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; unitOfMeasure: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; status: string; complianceStatus: string; concentration?: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; }) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>{product.unitOfMeasure}</TableCell>
                          <TableCell>
                            <StatusBadge status={product.status} />
                          </TableCell>
                          <TableCell>
                            <ComplianceBadge status={product.complianceStatus} />
                          </TableCell>
                          <TableCell className="text-right">
                            <MedicineVendorSearchModal
                              productId={product.id as string}
                              productName={product.name as string}
                              concentration={product.concentration as string}
                              trigger={
                                <Button variant="ghost" size="sm">
                                  <Search className="h-4 w-4 mr-1" />
                                  Find Vendors
                                </Button>
                              }
                            />
                            <Button variant="ghost" size="sm">View</Button>
                            <Button variant="ghost" size="sm">Edit</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="mt-6 flex justify-center">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={pagination.totalPages}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Upload Modal */}
      <ProductUploadModal 
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    ON_HOLD: "bg-yellow-100 text-yellow-800",
    DISCONTINUED: "bg-red-100 text-red-800",
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[status]}`}>
      {status}
    </span>
  );
}

function ComplianceBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    COMPLIANT: "bg-green-100 text-green-800",
    NON_COMPLIANT: "bg-red-100 text-red-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    UNDER_REVIEW: "bg-blue-100 text-blue-800",
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
