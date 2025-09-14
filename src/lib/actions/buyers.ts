'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, canEditBuyer } from '@/lib/auth';
import { db, buyers, buyerHistory } from '@/lib/db';
import { createBuyerSchema, updateBuyerSchema, csvBuyerSchema } from '@/lib/validations/buyer';
import { eq, and } from 'drizzle-orm';
import { LRUCache } from 'lru-cache';

// Rate limiting cache (in-memory, not production-ready but demonstrates the concept)
const rateLimitCache = new LRUCache<string, number>({
  max: 1000,
  ttl: 60 * 1000, // 1 minute
});

// Rate limiting function
function checkRateLimit(userId: string, maxRequests: number = 10): boolean {
  const key = `rate_limit_${userId}`;
  const current = rateLimitCache.get(key) || 0;
  
  if (current >= maxRequests) {
    return false;
  }
  
  rateLimitCache.set(key, current + 1);
  return true;
}

export async function createBuyer(formData: FormData) {
  const user = await requireAuth();

  // Check rate limit
  if (!checkRateLimit(user.id)) {
    throw new Error('Too many requests. Please try again later.');
  }

  try {
    // Parse and validate form data
    const rawData = {
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string,
      city: formData.get('city') as string,
      propertyType: formData.get('propertyType') as string,
      bhk: (formData.get('bhk') as string) || undefined,
      purpose: formData.get('purpose') as string,
      budgetMin: (() => {
        const val = formData.get('budgetMin') as string;
        return val && val !== '' ? parseInt(val) : undefined;
      })(),
      budgetMax: (() => {
        const val = formData.get('budgetMax') as string;
        return val && val !== '' ? parseInt(val) : undefined;
      })(),
      timeline: formData.get('timeline') as string,
      source: formData.get('source') as string,
      notes: formData.get('notes') as string || undefined,
      tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean) : [],
    };

    const validatedData = createBuyerSchema.parse(rawData);

    // Insert buyer in transaction
    const result = await db.transaction(async (tx) => {
      // Insert the buyer
      const [newBuyer] = await tx.insert(buyers).values({
        ...validatedData,
        ownerId: user.id,
      }).returning();

      // Create initial history entry
      await tx.insert(buyerHistory).values({
        buyerId: newBuyer.id,
        changedBy: user.id,
        diff: JSON.stringify({
          created: [null, JSON.stringify(validatedData)]
        }),
      });

      return newBuyer;
    });

    revalidatePath('/buyers');
    redirect(`/buyers/${result.id}`);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create buyer');
  }
}

export async function updateBuyer(formData: FormData) {
  const user = await requireAuth();

  // Check rate limit
  if (!checkRateLimit(user.id)) {
    throw new Error('Too many requests. Please try again later.');
  }

  try {
    const buyerId = formData.get('id') as string;
    const submittedUpdatedAt = formData.get('updatedAt') as string;

    // Parse form data
    const rawData = {
      id: buyerId,
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string,
      city: formData.get('city') as string,
      propertyType: formData.get('propertyType') as string,
      bhk: (formData.get('bhk') as string) || undefined,
      purpose: formData.get('purpose') as string,
      budgetMin: (() => {
        const val = formData.get('budgetMin') as string;
        return val && val !== '' ? parseInt(val) : undefined;
      })(),
      budgetMax: (() => {
        const val = formData.get('budgetMax') as string;
        return val && val !== '' ? parseInt(val) : undefined;
      })(),
      timeline: formData.get('timeline') as string,
      source: formData.get('source') as string,
      status: formData.get('status') as string,
      notes: formData.get('notes') as string || undefined,
      tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean) : [],
      updatedAt: submittedUpdatedAt,
    };

    const validatedData = updateBuyerSchema.parse(rawData);

    // Get current buyer data for comparison
    const [currentBuyer] = await db
      .select()
      .from(buyers)
      .where(eq(buyers.id, buyerId))
      .limit(1);

    if (!currentBuyer) {
      throw new Error('Buyer not found');
    }

    // Check ownership or admin role
    if (!canEditBuyer(user, currentBuyer.ownerId)) {
      throw new Error('Unauthorized to edit this buyer');
    }

    // Optimistic concurrency control
    if (submittedUpdatedAt && currentBuyer.updatedAt.toISOString() !== submittedUpdatedAt) {
      throw new Error('This record was modified by another user since you started editing. Please refresh the page and try again.');
    }

    // Calculate changes for history
    const changes: Record<string, [any, any]> = {};
    const fieldsToCheck = ['fullName', 'email', 'phone', 'city', 'propertyType', 'bhk', 'purpose', 'budgetMin', 'budgetMax', 'timeline', 'source', 'status', 'notes', 'tags'];
    
    for (const field of fieldsToCheck) {
      const oldValue = currentBuyer[field as keyof typeof currentBuyer];
      const newValue = validatedData[field as keyof typeof validatedData];
      
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[field] = [oldValue, newValue];
      }
    }

    // Update buyer in transaction
    await db.transaction(async (tx) => {
      // Update the buyer
      await tx.update(buyers)
        .set({
          fullName: validatedData.fullName,
          email: validatedData.email,
          phone: validatedData.phone,
          city: validatedData.city,
          propertyType: validatedData.propertyType,
          bhk: validatedData.bhk,
          purpose: validatedData.purpose,
          budgetMin: validatedData.budgetMin,
          budgetMax: validatedData.budgetMax,
          timeline: validatedData.timeline,
          source: validatedData.source,
          status: validatedData.status,
          notes: validatedData.notes,
          tags: validatedData.tags,
        })
        .where(eq(buyers.id, buyerId));

      // Create history entry if there are changes
      if (Object.keys(changes).length > 0) {
        await tx.insert(buyerHistory).values({
          buyerId,
          changedBy: user.id,
          diff: JSON.stringify(changes),
        });
      }
    });

    revalidatePath('/buyers');
    revalidatePath(`/buyers/${buyerId}`);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update buyer');
  }
}

export async function updateBuyerStatus(buyerId: string, status: string) {
  const user = await requireAuth();

  // Check rate limit
  if (!checkRateLimit(user.id)) {
    throw new Error('Too many requests. Please try again later.');
  }

  try {
    // Get current buyer data
    const [currentBuyer] = await db
      .select()
      .from(buyers)
      .where(eq(buyers.id, buyerId))
      .limit(1);

    if (!currentBuyer) {
      throw new Error('Buyer not found');
    }

    // Check ownership or admin role
    if (!canEditBuyer(user, currentBuyer.ownerId)) {
      throw new Error('Unauthorized to edit this buyer');
    }

    // Update status in transaction
    await db.transaction(async (tx) => {
      // Update the status
      await tx.update(buyers)
        .set({ status: status as any })
        .where(eq(buyers.id, buyerId));

      // Create history entry
      await tx.insert(buyerHistory).values({
        buyerId,
        changedBy: user.id,
        diff: JSON.stringify({
          status: [currentBuyer.status, status]
        }),
      });
    });

    revalidatePath('/buyers');
    revalidatePath(`/buyers/${buyerId}`);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update buyer status');
  }
}
