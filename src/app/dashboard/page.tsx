import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  Users, 
  FileText, 
  TruckIcon, 
  BarChart3,
  PlusCircle,
  Pill 
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">HealthSupply Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
            <p className="text-gray-600">
              Manage your supply chain operations from one central dashboard
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Total Products"
              value="1,234"
              icon={<Package className="h-6 w-6 text-blue-600" />}
              trend="+12% from last month"
            />
            <StatCard 
              title="Active Vendors"
              value="56"
              icon={<Users className="h-6 w-6 text-green-600" />}
              trend="+3 new this week"
            />
            <StatCard 
              title="Open RFQs"
              value="18"
              icon={<FileText className="h-6 w-6 text-orange-600" />}
              trend="5 pending quotes"
            />
            <StatCard 
              title="In Transit"
              value="24"
              icon={<TruckIcon className="h-6 w-6 text-purple-600" />}
              trend="3 arriving today"
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ActionCard
                title="Add Products"
                description="Upload new products or manage existing catalog"
                icon={<Package className="h-8 w-8" />}
                href="/dashboard/products"
                color="blue"
              />
              <ActionCard
                title="Manage Vendors"
                description="View and update vendor information"
                icon={<Users className="h-8 w-8" />}
                href="/dashboard/vendors"
                color="green"
              />
              <ActionCard
                title="Create RFQ"
                description="Start a new Request for Quote process"
                icon={<FileText className="h-8 w-8" />}
                href="/dashboard/rfq/new"
                color="orange"
              />
              <ActionCard
                title="Track Shipments"
                description="Monitor delivery status and logistics"
                icon={<TruckIcon className="h-8 w-8" />}
                href="/dashboard/shipments"
                color="purple"
              />
              <ActionCard
                title="View Analytics"
                description="Analyze performance and generate reports"
                icon={<BarChart3 className="h-8 w-8" />}
                href="/dashboard/analytics"
                color="indigo"
              />
              <ActionCard
                title="Purchase Orders"
                description="Manage and track purchase orders"
                icon={<PlusCircle className="h-8 w-8" />}
                href="/dashboard/purchase-orders"
                color="pink"
              />
              <ActionCard
                title="Latvia Registry"
                description="Browse pharmaceutical data from Latvia"
                icon={<Pill className="h-8 w-8" />}
                href="/dashboard/latvia-registry"
                color="green"
              />
            </div>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates across your supply chain</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ActivityItem 
                  type="product"
                  message="New product added: Medical Gloves (Box of 100)"
                  time="2 hours ago"
                />
                <ActivityItem 
                  type="rfq"
                  message="RFQ #RF-2024-034 received 3 new quotes"
                  time="4 hours ago"
                />
                <ActivityItem 
                  type="shipment"
                  message="Shipment #SH-8821 delivered successfully"
                  time="Yesterday"
                />
                <ActivityItem 
                  type="vendor"
                  message="New vendor registered: MediSupply Inc."
                  time="2 days ago"
                />
              </div>
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
  trend 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  trend: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">{icon}</div>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold mb-2">{value}</p>
          <p className="text-xs text-gray-500">{trend}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionCard({ 
  title, 
  description, 
  icon, 
  href,
  color 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode;
  href: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    green: "bg-green-50 text-green-600 hover:bg-green-100",
    orange: "bg-orange-50 text-orange-600 hover:bg-orange-100",
    purple: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    indigo: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
    pink: "bg-pink-50 text-pink-600 hover:bg-pink-100",
  };

  return (
    <Link href={href}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="p-6">
          <div className={`inline-flex p-3 rounded-lg mb-4 ${colorClasses[color]}`}>
            {icon}
          </div>
          <h4 className="font-semibold mb-2">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function ActivityItem({ 
  type, 
  message, 
  time 
}: { 
  type: string; 
  message: string; 
  time: string;
}) {
  const icons: Record<string, React.ReactNode> = {
    product: <Package className="h-5 w-5 text-blue-600" />,
    rfq: <FileText className="h-5 w-5 text-orange-600" />,
    shipment: <TruckIcon className="h-5 w-5 text-purple-600" />,
    vendor: <Users className="h-5 w-5 text-green-600" />,
  };

  return (
    <div className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
      <div className="p-2 bg-gray-100 rounded-lg">{icons[type]}</div>
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
}
