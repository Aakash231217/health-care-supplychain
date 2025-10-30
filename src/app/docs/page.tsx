'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Package, 
  Home,
  ChevronRight,
  Code,
  BookOpen,
  Server,
  Shield,
  Rocket,
  FileText,
  Menu,
  X,
  Database,
  Network,
  CheckCircle
} from 'lucide-react';
import { Overview } from '@/components/docs/Overview';
import { Features } from '@/components/docs/Features';
import { Architecture } from '@/components/docs/Architecture';
import { TechStack } from '@/components/docs/TechStack';
import { DatabaseSchema } from '@/components/docs/DatabaseSchema';
import { ApiReference } from '@/components/docs/ApiReference';
import { Security } from '@/components/docs/Security';
import { Deployment } from '@/components/docs/Deployment';
import { GettingStarted } from '@/components/docs/GettingStarted';
import { ProjectStructure } from '@/components/docs/ProjectStructure';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sections = [
    { id: 'overview', title: 'Overview', icon: BookOpen },
    { id: 'features', title: 'Features', icon: CheckCircle },
    { id: 'architecture', title: 'System Architecture', icon: Network },
    { id: 'tech-stack', title: 'Tech Stack', icon: Code },
    { id: 'database', title: 'Database Schema', icon: Database },
    { id: 'api', title: 'API Reference', icon: Server },
    { id: 'security', title: 'Security', icon: Shield },
    { id: 'getting-started', title: 'Getting Started', icon: FileText },
    { id: 'project-structure', title: 'Project Structure', icon: FileText },
    { id: 'deployment', title: 'Deployment', icon: Rocket },
  ];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80">
                <Package className="h-8 w-8" />
                <span className="text-xl font-bold">HealthSupply</span>
              </Link>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span className="text-lg font-medium">Documentation</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 overflow-y-auto border-r bg-white p-6`}>
          <nav className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {section.title}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 lg:p-12 max-w-5xl">
          <Overview />
          <Features />
          <Architecture />
          <TechStack />
          <DatabaseSchema />
          <ApiReference />
          <Security />
          <GettingStarted />
          <ProjectStructure />
          <Deployment />
        </main>
      </div>
    </div>
  );
}
