'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TruckIcon, ArrowLeft, Package, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function ShipmentsPage() {
  const shipments = [
    {
      id: '1',
      shipmentNumber: 'SH-2024-001',
      poNumber: 'PO-2024-045',
      vendor: 'MediSupply Inc.',
      trackingNumber: 'TRK123456789',
      status: 'IN_TRANSIT',
      shippedDate: new Date('2024-01-20'),
      estimatedDelivery: new Date('2024-01-25'),
      location: 'Distribution Center, Chicago',
    },
    {
      id: '2',
      shipmentNumber: 'SH-2024-002',
      poNumber: 'PO-2024-046',
      vendor: 'Healthcare Solutions Ltd',
      trackingNumber: 'TRK987654321',
      status: 'DELIVERED',
      shippedDate: new Date('2024-01-18'),
      estimatedDelivery: new Date('2024-01-23'),
      location: 'Delivered',
    },
    {
      id: '3',
      shipmentNumber: 'SH-2024-003',
      poNumber: 'PO-2024-047',
      vendor: 'Global Medical Supplies',
      trackingNumber: 'TRK456789123',
      status: 'OUT_FOR_DELIVERY',
      shippedDate: new Date('2024-01-22'),
      estimatedDelivery: new Date('2024-01-24'),
      location: 'Local Delivery Hub',
    },
  ];

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
              <TruckIcon className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Shipment Tracking</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Shipments"
              value="24"
              icon={<Package className="h-6 w-6 text-blue-600" />}
              color="blue"
            />
            <StatCard
              title="In Transit"
              value="8"
              icon={<TruckIcon className="h-6 w-6 text-purple-600" />}
              color="purple"
            />
            <StatCard
              title="Out for Delivery"
              value="3"
              icon={<MapPin className="h-6 w-6 text-orange-600" />}
              color="orange"
            />
            <StatCard
              title="Delivered Today"
              value="5"
              icon={<Package className="h-6 w-6 text-green-600" />}
              color="green"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Active Shipments</CardTitle>
              <CardDescription>Real-time tracking of all shipments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shipment #</TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Shipped</TableHead>
                    <TableHead>Est. Delivery</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-mono text-sm">{shipment.shipmentNumber}</TableCell>
                      <TableCell className="font-mono text-sm">{shipment.poNumber}</TableCell>
                      <TableCell>{shipment.vendor}</TableCell>
                      <TableCell className="font-mono text-xs">{shipment.trackingNumber}</TableCell>
                      <TableCell>{format(shipment.shippedDate, 'MMM dd')}</TableCell>
                      <TableCell>{format(shipment.estimatedDelivery, 'MMM dd')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="truncate max-w-[150px]">{shipment.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={shipment.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Track</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon,
  color 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50",
    purple: "bg-purple-50",
    orange: "bg-orange-50",
    green: "bg-green-50",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className={`inline-flex p-3 rounded-lg mb-4 ${colorClasses[color]}`}>
          {icon}
        </div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-800",
    PICKED_UP: "bg-blue-100 text-blue-800",
    IN_TRANSIT: "bg-purple-100 text-purple-800",
    OUT_FOR_DELIVERY: "bg-orange-100 text-orange-800",
    DELIVERED: "bg-green-100 text-green-800",
    DELAYED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
