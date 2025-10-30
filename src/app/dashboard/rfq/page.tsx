'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, ArrowLeft, Plus, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function RFQPage() {
  // Mock data
  const rfqs = [
    {
      id: '1',
      rfqNumber: 'RFQ-2024-001',
      title: 'Medical Supplies Q1 2024',
      status: 'ISSUED',
      issueDate: new Date('2024-01-15'),
      dueDate: new Date('2024-01-30'),
      vendorsInvited: 5,
      quotesReceived: 3,
    },
    {
      id: '2',
      rfqNumber: 'RFQ-2024-002',
      title: 'Surgical Equipment',
      status: 'EVALUATION',
      issueDate: new Date('2024-01-20'),
      dueDate: new Date('2024-02-05'),
      vendorsInvited: 8,
      quotesReceived: 7,
    },
    {
      id: '3',
      rfqNumber: 'RFQ-2024-003',
      title: 'PPE Bulk Order',
      status: 'CLOSED',
      issueDate: new Date('2024-01-10'),
      dueDate: new Date('2024-01-25'),
      vendorsInvited: 6,
      quotesReceived: 6,
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
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Request for Quote (RFQ)</h1>
            </div>
            <Button asChild>
              <Link href="/dashboard/rfq/new">
                <Plus className="h-4 w-4 mr-2" />
                Create RFQ
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total RFQs"
              value="18"
              icon={<FileText className="h-6 w-6 text-blue-600" />}
              color="blue"
            />
            <StatCard
              title="Open RFQs"
              value="7"
              icon={<Clock className="h-6 w-6 text-orange-600" />}
              color="orange"
            />
            <StatCard
              title="In Evaluation"
              value="5"
              icon={<CheckCircle className="h-6 w-6 text-yellow-600" />}
              color="yellow"
            />
            <StatCard
              title="Closed"
              value="6"
              icon={<XCircle className="h-6 w-6 text-green-600" />}
              color="green"
            />
          </div>

          {/* RFQ List */}
          <Card>
            <CardHeader>
              <CardTitle>All RFQs</CardTitle>
              <CardDescription>Manage and track your requests for quotes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RFQ Number</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Vendors</TableHead>
                    <TableHead>Quotes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfqs.map((rfq) => (
                    <TableRow key={rfq.id}>
                      <TableCell className="font-mono text-sm">{rfq.rfqNumber}</TableCell>
                      <TableCell className="font-medium">{rfq.title}</TableCell>
                      <TableCell>{format(rfq.issueDate, 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(rfq.dueDate, 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{rfq.vendorsInvited}</TableCell>
                      <TableCell>
                        <span className="font-medium">{rfq.quotesReceived}</span>
                        <span className="text-gray-500">/{rfq.vendorsInvited}</span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={rfq.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                        <Button variant="ghost" size="sm">Compare</Button>
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
    orange: "bg-orange-50",
    yellow: "bg-yellow-50",
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
    DRAFT: "bg-gray-100 text-gray-800",
    ISSUED: "bg-blue-100 text-blue-800",
    RESPONSES_RECEIVED: "bg-purple-100 text-purple-800",
    EVALUATION: "bg-yellow-100 text-yellow-800",
    CLOSED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
