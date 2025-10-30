import { Card } from '@/components/ui/card';

export function ApiReference() {
  const apiEndpoints = [
    { method: 'product.getAll', desc: 'List all products with pagination', type: 'Query' },
    { method: 'product.getById', desc: 'Get product by ID', type: 'Query' },
    { method: 'product.create', desc: 'Create new product', type: 'Mutation' },
    { method: 'product.update', desc: 'Update product', type: 'Mutation' },
    { method: 'product.delete', desc: 'Delete product', type: 'Mutation' },
    { method: 'product.bulkUpload', desc: 'Bulk upload products from CSV/Excel', type: 'Mutation' }
  ];

  return (
    <section id="api" className="mb-16">
      <h2 className="text-3xl font-bold mb-6">API Reference</h2>
      <p className="mb-6 text-gray-600">
        The application uses tRPC for type-safe APIs. Here are the available procedures:
      </p>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Product Router</h3>
          <div className="space-y-2">
            {apiEndpoints.map((api, idx) => (
              <Card key={idx} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded font-mono ${
                      api.type === 'Query' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {api.type}
                    </span>
                    <code className="text-sm font-mono">{api.method}</code>
                  </div>
                  <span className="text-sm text-gray-600">{api.desc}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm">
            <strong>Note:</strong> Additional routers for Vendor, RFQ, Shipment, and other entities 
            follow the same pattern with their respective CRUD operations.
          </p>
        </div>
      </div>
    </section>
  );
}
