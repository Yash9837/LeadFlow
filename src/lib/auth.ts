import { createClient } from '@/lib/supabase/server';

export interface UserWithRole {
  id: string;
  email?: string;
  isAdmin: boolean;
}

export async function getCurrentUser(): Promise<UserWithRole | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  // Check if user has admin role from Supabase metadata
  // You can set this in Supabase Auth > User Management > Metadata
  const isAdmin = user.user_metadata?.role === 'admin' || 
                  user.app_metadata?.role === 'admin' ||
                  user.email === 'admin@leadflow.com'; // Demo admin email

  return {
    id: user.id,
    email: user.email,
    isAdmin,
  };
}

export async function requireAuth(): Promise<UserWithRole> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export function canEditBuyer(user: UserWithRole, buyerOwnerId: string): boolean {
  return user.isAdmin || user.id === buyerOwnerId;
}

export function canViewAllBuyers(user: UserWithRole): boolean {
  return user.isAdmin;
}
