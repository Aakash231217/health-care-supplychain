import { CheckCircle } from 'lucide-react';

export function Features() {
  const features = [
    { title: 'Product Management', desc: 'Centralized catalog with automated parsing', status: true },
    { title: 'Vendor Management', desc: 'Track vendor performance and certifications', status: true },
    { title: 'RFQ & Procurement', desc: 'Automated quote requests and bid comparison', status: true },
    { title: 'Shipment Tracking', desc: 'Real-time visibility with carrier integration', status: true },
    { title: 'Quality & Compliance', desc: 'Automated quality checks and audits', status: true },
    { title: 'Analytics & Reports', desc: 'Data-driven insights and KPI tracking', status: true },
  ];

  return (
    <section id="features" className="mb-16">
      <h2 className="text-3xl font-bold mb-6">Features</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {features.map((feature, idx) => (
          <div key={idx} className="flex items-start gap-3 p-4 rounded-lg border bg-white">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-semibold">{feature.title}</h4>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
