import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SupplierMatcher } from '@/components/latvia-pharma/SupplierMatcher';
import { BatchSupplierMatcher } from '@/components/latvia-pharma/BatchSupplierMatcher';

export const metadata: Metadata = {
  title: 'Find Suppliers | Healthcare Supply Chain',
  description: 'Find suppliers from Latvia pharmaceutical registry',
};

export default function SuppliersPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Find Suppliers</h1>
        <p className="text-muted-foreground">
          Search for pharmaceutical suppliers from Latvia registry
        </p>
      </div>
      
      <Tabs defaultValue="single" className="space-y-4">
        <TabsList>
          <TabsTrigger value="single">Single Product Search</TabsTrigger>
          <TabsTrigger value="batch">Batch Matching</TabsTrigger>
        </TabsList>
        
        <TabsContent value="single" className="space-y-4">
          <SupplierMatcher />
        </TabsContent>
        
        <TabsContent value="batch" className="space-y-4">
          <BatchSupplierMatcher />
        </TabsContent>
      </Tabs>
    </div>
  );
}
