import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 mr-2 text-primary" />
            <h1 className="text-2xl font-bold text-primary">LeadFlow</h1>
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">Authentication Error</CardTitle>
            <CardDescription className="text-muted-foreground">
              We couldn't complete your login request
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                The login link may have expired or been used already. This can happen if:
              </p>
              
              <div className="text-left space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2"></div>
                  <span>The link has expired (links are valid for 1 hour)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2"></div>
                  <span>The link has already been used</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2"></div>
                  <span>There was a network connectivity issue</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground pt-2">
                Don't worry - you can easily request a new login link.
              </p>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium">
                <Link href="/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Need help? Contact your administrator for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}