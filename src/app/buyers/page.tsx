import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, canViewAllBuyers } from '@/lib/auth';
import { db, buyers } from '@/lib/db';
import { eq, desc, and, ilike, or, sql } from 'drizzle-orm';
import BuyersList from '@/components/buyers-list';
import Navigation from '@/components/navigation';
import { redirect } from 'next/navigation';

interface BuyersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    city?: string;
    propertyType?: string;
    status?: string;
    timeline?: string;
    sort?: string;
  }>;
}

async function getBuyers(searchParams: BuyersPageProps['searchParams']) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = 10;
  const offset = (page - 1) * limit;

  // Build where conditions - admins can see all, others only their own
  const conditions = canViewAllBuyers(user) ? [] : [eq(buyers.ownerId, user.id)];
  
  if (params.search) {
    conditions.push(
      or(
        ilike(buyers.fullName, `%${params.search}%`),
        ilike(buyers.phone, `%${params.search}%`),
        ilike(buyers.email, `%${params.search}%`)
      )!
    );
  }

  if (params.city) {
    conditions.push(eq(buyers.city, params.city as any));
  }

  if (params.propertyType) {
    conditions.push(eq(buyers.propertyType, params.propertyType as any));
  }

  if (params.status) {
    conditions.push(eq(buyers.status, params.status as any));
  }

  if (params.timeline) {
    conditions.push(eq(buyers.timeline, params.timeline as any));
  }

  // Build sort order
  let orderBy = desc(buyers.updatedAt);
  if (params.sort) {
    const [field, direction] = params.sort.split(':');
    if (field && direction) {
      const column = buyers[field as keyof typeof buyers];
      if (column) {
        orderBy = direction === 'asc' ? column : desc(column);
      }
    }
  }

  // Get total count
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(buyers)
    .where(and(...conditions));

  const total = Number(totalResult?.count || 0);

  // Get paginated results
  const results = await db
    .select()
    .from(buyers)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  return {
    buyers: results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    filters: params,
  };
}

export default async function BuyersPage({ searchParams }: BuyersPageProps) {
  const data = await getBuyers(searchParams);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold mb-4">Your Buyer Portfolio</h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Track and manage your real estate leads with professional tools designed for success
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold text-foreground">{data.pagination.total}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-lg">📊</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Leads</p>
                <p className="text-2xl font-bold text-foreground">
                  {data.buyers.filter(b => !['Converted', 'Dropped'].includes(b.status)).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-semibold text-lg">🏠</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Converted</p>
                <p className="text-2xl font-bold text-foreground">
                  {data.buyers.filter(b => b.status === 'Converted').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-emerald-600 font-semibold text-lg">✅</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground">
                  {data.buyers.filter(b => {
                    const monthAgo = new Date();
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return new Date(b.createdAt) > monthAgo;
                  }).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-semibold text-lg">📈</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Suspense fallback={
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        }>
          <BuyersList 
            buyers={data.buyers} 
            pagination={data.pagination}
            filters={data.filters}
          />
        </Suspense>
      </div>
    </div>
  );
}
