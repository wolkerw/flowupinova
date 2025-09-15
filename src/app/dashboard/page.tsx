import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <h1 className="text-4xl font-bold text-foreground mb-4 font-headline">Dashboard</h1>
      <p className="text-muted-foreground mb-8">Esta é uma página de espaço reservado para o painel.</p>
      <Link href="/">
        <Button>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para o Chat
        </Button>
      </Link>
    </div>
  );
}
