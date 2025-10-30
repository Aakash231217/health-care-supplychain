import { Card } from '@/components/ui/card';

export function Overview() {
  return (
    <section id="overview" className="mb-16">
      <h1 className="text-4xl font-bold mb-4">Healthcare Supply Chain Management System</h1>
      <p className="text-lg text-gray-600 mb-8">
        A comprehensive platform designed to streamline the procurement, tracking, and management 
        of medical products and supplies.
      </p>
      
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <h3 className="text-xl font-semibold mb-3">Quick Start</h3>
        <div className="space-y-2">
          <p>Get up and running with our platform in minutes:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Clone the repository</li>
            <li>Install dependencies with <code className="bg-gray-100 px-2 py-1 rounded">npm install</code></li>
            <li>Configure environment variables</li>
            <li>Run <code className="bg-gray-100 px-2 py-1 rounded">npm run dev</code></li>
          </ol>
        </div>
      </Card>
    </section>
  );
}
