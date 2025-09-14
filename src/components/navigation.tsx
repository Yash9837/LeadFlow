'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Users, Plus, Building2, LogOut, Shield, User, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        const adminStatus = user.user_metadata?.role === 'admin' || 
                           user.app_metadata?.role === 'admin' ||
                           user.email === 'admin@leadflow.com';
        setIsAdmin(adminStatus);
      }
    };
    checkUserStatus();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const navItems = [
    { href: '/buyers', label: 'Portfolio', icon: Users, description: 'View all leads' },
    { href: '/buyers/new', label: 'Add Lead', icon: Plus, description: 'Create new lead' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Main Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/buyers" className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold text-foreground">LeadFlow</span>
                  {isAdmin && (
                    <div className="flex items-center space-x-1 mt-0.5">
                      <Shield className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium text-primary">Admin</span>
                    </div>
                  )}
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "h-10 px-4 rounded-lg transition-all duration-200",
                        isActive 
                          ? "bg-primary text-white shadow-sm" 
                          : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                      )}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>

            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="truncate max-w-32">{userEmail}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="text-muted-foreground hover:text-foreground"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-4 space-y-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <div
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200",
                        isActive 
                          ? "bg-primary text-white" 
                          : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs opacity-75">{item.description}</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
              
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="truncate">{userEmail}</span>
                  {isAdmin && (
                    <div className="flex items-center space-x-1">
                      <Shield className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium text-primary">Admin</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-gray-50 mt-2"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Breadcrumb for context */}
      {pathname !== '/buyers' && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex items-center space-x-2 text-sm">
              <Link 
                href="/buyers" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Portfolio
              </Link>
              {pathname.includes('/buyers/new') && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-foreground font-medium">Add New Lead</span>
                </>
              )}
              {pathname.includes('/buyers/') && !pathname.includes('/new') && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-foreground font-medium">Lead Details</span>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}