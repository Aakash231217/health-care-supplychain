'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Building } from "lucide-react";

// Simple vendor detail page showing what products they supply
export default function VendorDetailSimplePage() {
  const params = useParams();
  const vendorId = params.id as string;

  // This is temporary - you would fetch real data here
  const vendorName = "MAGNUM MEDICAL";
  
  // Example of products this vendor supplies
  const products = [
    {
      drugName: "Diazepam-Desitin Rectal tube 10mg",
      activeIngredient: "Diazepamum",
      manufacturer: "DESITIN ARZNEIMITTEL, Germany",
      atcCode: "N05BA01",
    },
    {
      drugName: "DIVIGEL 1 mg/dózis gél",
      activeIngredient: "Estradiolum",
      manufacturer: "Orion Corporation, Finland",
      atcCode: "G03CA03",
    },
    {
      drugName: "SOLIDON",
      activeIngredient: "Chlorpromazini hydrochloridum",
      manufacturer: "Adelco, Greece",
      atcCode: "N05AA01",
    }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard/vendors">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vendors
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building className="h-6 w-6" />
            {vendorName}
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Products Supplied</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Drug Name</TableHead>
                  <TableHead>Active Ingredient</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>ATC Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>{product.drugName}</TableCell>
                    <TableCell>{product.activeIngredient}</TableCell>
                    <TableCell>{product.manufacturer}</TableCell>
                    <TableCell>{product.atcCode}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
