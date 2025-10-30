import { Shield } from 'lucide-react';

export function Security() {
  const securityMeasures = [
    'JWT-based authentication with NextAuth',
    'Role-based access control (RBAC) for different user types',
    'Input validation and sanitization with Zod',
    'SQL injection prevention via Prisma\'s prepared statements',
    'HTTPS enforcement in production',
    'Environment variable protection for sensitive data'
  ];

  return (
    <section id="security" className="mb-16">
      <h2 className="text-3xl font-bold mb-6">Security Measures</h2>
      <div className="space-y-4">
        {securityMeasures.map((measure, idx) => (
          <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-green-50">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <span>{measure}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
