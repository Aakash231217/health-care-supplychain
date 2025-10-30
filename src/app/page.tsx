import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Users, 
  FileText, 
  TruckIcon, 
  BarChart3, 
  Shield 
} from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">HealthSupply</h1>
          </div>
          <div className="flex gap-4">
            <Link href="/docs">
              <Button variant="outline">Documentation</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-bold mb-6 text-gray-900">
            Healthcare Supply Chain Management
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Streamline procurement, tracking, and management of medical products 
            and supplies with our comprehensive platform
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8">
                Access Dashboard
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="text-lg px-8">
                View Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Comprehensive Supply Chain Solution
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Package className="h-10 w-10 text-primary" />}
              title="Product Management"
              description="Centralized catalog with automated parsing, categorization, and compliance tracking"
            />
            <FeatureCard
              icon={<Users className="h-10 w-10 text-primary" />}
              title="Vendor Management"
              description="Track vendor performance, certifications, and manage relationships efficiently"
            />
            <FeatureCard
              icon={<FileText className="h-10 w-10 text-primary" />}
              title="RFQ & Procurement"
              description="Automate quote requests, compare bids, and streamline purchase orders"
            />
            <FeatureCard
              icon={<TruckIcon className="h-10 w-10 text-primary" />}
              title="Shipment Tracking"
              description="Real-time visibility of shipments with carrier integration and delivery alerts"
            />
            <FeatureCard
              icon={<Shield className="h-10 w-10 text-primary" />}
              title="Quality & Compliance"
              description="Ensure regulatory compliance with automated quality checks and audits"
            />
            <FeatureCard
              icon={<BarChart3 className="h-10 w-10 text-primary" />}
              title="Analytics & Reports"
              description="Data-driven insights with customizable dashboards and KPI tracking"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold mb-4">HealthSupply</h3>
              <p className="text-sm text-gray-600">
                Modern healthcare supply chain management platform
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Links</h3>
              <div className="space-y-2 text-sm">
                <div><Link href="/about" className="text-gray-600 hover:text-primary">About</Link></div>
                <div><Link href="/contact" className="text-gray-600 hover:text-primary">Contact</Link></div>
                <div><Link href="/privacy" className="text-gray-600 hover:text-primary">Privacy</Link></div>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <div className="space-y-2 text-sm">
                <div><Link href="/docs" className="text-gray-600 hover:text-primary">Documentation</Link></div>
                <div><Link href="/support" className="text-gray-600 hover:text-primary">Help Center</Link></div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600">
            © 2025 HealthSupply. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
