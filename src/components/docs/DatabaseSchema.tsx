import { Database } from 'lucide-react';

export function DatabaseSchema() {
  const schemas = [
    { entity: 'User', desc: 'System users with role-based access' },
    { entity: 'Product', desc: 'Medical products and supplies catalog' },
    { entity: 'Vendor', desc: 'Supplier information and performance metrics' },
    { entity: 'RFQ', desc: 'Request for Quote management' },
    { entity: 'Quote', desc: 'Vendor quotes and bids' },
    { entity: 'PurchaseOrder', desc: 'Purchase order processing' },
    { entity: 'Shipment', desc: 'Logistics and tracking information' },
    { entity: 'QualityCheck', desc: 'Compliance and quality assurance records' },
    { entity: 'Invoice', desc: 'Financial tracking and billing' }
  ];

  return (
    <section id="database" className="mb-16">
      <h2 className="text-3xl font-bold mb-6">Database Schema</h2>
      <p className="mb-6 text-gray-600">
        Our database is designed to handle complex supply chain relationships while maintaining data integrity:
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        {schemas.map((schema, idx) => (
          <div key={idx} className="flex gap-4 p-4 rounded-lg border bg-white">
            <Database className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold">{schema.entity}</h4>
              <p className="text-sm text-gray-600">{schema.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
