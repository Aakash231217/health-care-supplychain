import { Card } from '@/components/ui/card';
import { Code } from 'lucide-react';

export function TechStack() {
  const techStack = [
    { category: 'Frontend', tech: ['Next.js 14', 'React', 'TailwindCSS', 'shadcn/ui'] },
    { category: 'Backend', tech: ['tRPC', 'Prisma ORM', 'NextAuth.js'] },
    { category: 'Database', tech: ['PostgreSQL (Neon)', 'Redis (Upstash)'] },
    { category: 'File Storage', tech: ['UploadThing', 'Cloudinary'] },
    { category: 'Services', tech: ['Resend (Email)', 'Sentry (Monitoring)'] },
    { category: 'Deployment', tech: ['Vercel', 'Edge Functions'] }
  ];

  return (
    <section id="tech-stack" className="mb-16">
      <h2 className="text-3xl font-bold mb-6">Tech Stack</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {techStack.map((stack, idx) => (
          <Card key={idx} className="p-4">
            <h3 className="font-semibold mb-3 text-lg">{stack.category}</h3>
            <ul className="space-y-1">
              {stack.tech.map((item, itemIdx) => (
                <li key={itemIdx} className="text-sm text-gray-600 flex items-center gap-2">
                  <Code className="h-3 w-3 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </section>
  );
}
