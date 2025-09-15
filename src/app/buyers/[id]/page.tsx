import { notFound } from 'next/navigation';
import { getCurrentUser, canViewAllBuyers } from '@/lib/auth';
import { db, buyers, buyerHistory } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import BuyerDetail from '@/components/buyer-detail';
import Navigation from '@/components/navigation';
import { redirect } from 'next/navigation';

type BuyerPageProps = {
  params: Promise<{ id: string }>;
};

async function getBuyer(id: string) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  // Get buyer data - admins can see all, others only their own
  const whereCondition = canViewAllBuyers(user) 
    ? eq(buyers.id, id)
    : and(eq(buyers.id, id), eq(buyers.ownerId, user.id));

  const [buyer] = await db
    .select()
    .from(buyers)
    .where(whereCondition)
    .limit(1);

  if (!buyer) {
    return null;
  }

  // Get buyer history
  const history = await db
    .select()
    .from(buyerHistory)
    .where(eq(buyerHistory.buyerId, id))
    .orderBy(desc(buyerHistory.changedAt))
    .limit(5);

  return { buyer, history };
}

export default async function BuyerPage({ params }: BuyerPageProps) {
  const { id } = await params;
  const data = await getBuyer(id);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <BuyerDetail buyer={data.buyer} history={data.history} />
      </div>
    </div>
  );
}
