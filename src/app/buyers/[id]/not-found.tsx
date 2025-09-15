import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-red-600">Lead Not Found</CardTitle>
          <CardDescription>
            The buyer lead you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href="/buyers">
            <Button className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
