'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth, canViewAllBuyers } from '@/lib/auth';
import { db, buyers, buyerHistory } from '@/lib/db';
import { csvBuyerSchema } from '@/lib/validations/buyer';
import { parse } from 'papaparse';

export async function importCSV(formData: FormData) {
  const user = await requireAuth();

  const file = formData.get('file') as File;
  
  if (!file) {
    throw new Error('No file provided');
  }

  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    throw new Error('File too large. Maximum size is 5MB.');
  }

  try {
    const text = await file.text();
    const parseResult = parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, ''),
    });

    if (parseResult.errors.length > 0) {
      throw new Error(`CSV parsing error: ${parseResult.errors[0].message}`);
    }

    const rows = parseResult.data as Record<string, string>[];
    
    if (rows.length > 200) {
      throw new Error('Too many rows. Maximum 200 rows allowed per import.');
    }

    // Validate all rows first
    const validationErrors: Array<{ row: number; errors: string[] }> = [];
    
    rows.forEach((row, index) => {
      try {
        // Transform row data to match our schema
        const transformedRow = {
          fullName: row.fullname || row.full_name || '',
          email: row.email || undefined,
          phone: row.phone || row.phonenumber || row.phonenumber || '',
          city: row.city || '',
          propertyType: row.propertytype || row.property_type || '',
          bhk: row.bhk || undefined,
          purpose: row.purpose || '',
          budgetMin: row.budgetmin || row.budget_min ? parseInt(row.budgetmin || row.budget_min) : undefined,
          budgetMax: row.budgetmax || row.budget_max ? parseInt(row.budgetmax || row.budget_max) : undefined,
          timeline: row.timeline || '',
          source: row.source || '',
          notes: row.notes || undefined,
          tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        };

        csvBuyerSchema.parse(transformedRow);
      } catch (error) {
        if (error instanceof Error) {
          validationErrors.push({
            row: index + 1,
            errors: [error.message],
          });
        }
      }
    });

    if (validationErrors.length > 0) {
      throw new Error(`Validation failed for ${validationErrors.length} rows. Please check your data and try again.`);
    }

    // If all rows are valid, insert them in a transaction
    const results = await db.transaction(async (tx) => {
      const insertedBuyers = [];
      
      for (const row of rows) {
        // Transform row data
        const transformedRow = {
          fullName: row.fullname || row.full_name || '',
          email: row.email || undefined,
          phone: row.phone || row.phonenumber || row.phonenumber || '',
          city: row.city || '',
          propertyType: row.propertytype || row.property_type || '',
          bhk: row.bhk || undefined,
          purpose: row.purpose || '',
          budgetMin: row.budgetmin || row.budget_min ? parseInt(row.budgetmin || row.budget_min) : undefined,
          budgetMax: row.budgetmax || row.budget_max ? parseInt(row.budgetmax || row.budget_max) : undefined,
          timeline: row.timeline || '',
          source: row.source || '',
          notes: row.notes || undefined,
          tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
          ownerId: user.id,
        };

        // Insert buyer
        const [buyer] = await tx.insert(buyers).values(transformedRow).returning();

        // Create history entry
        await tx.insert(buyerHistory).values({
          buyerId: buyer.id,
          changedBy: user.id,
          diff: JSON.stringify({
            created: [null, JSON.stringify(transformedRow)]
          }),
        });

        insertedBuyers.push(buyer);
      }

      return insertedBuyers;
    });

    return {
      success: true,
      imported: results.length,
      message: `Successfully imported ${results.length} buyer leads.`,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to import CSV file');
  }
}

export async function exportCSV(searchParams: Record<string, string | undefined>) {
  const user = await requireAuth();

  try {
    // Build query based on search params (similar to buyers list page)
    const { eq, and, ilike, or, desc } = await import('drizzle-orm');
    
    // Admins can export all buyers, others only their own
    const conditions = canViewAllBuyers(user) ? [] : [eq(buyers.ownerId, user.id)];
    
    if (searchParams.search) {
      conditions.push(
        or(
          ilike(buyers.fullName, `%${searchParams.search}%`),
          ilike(buyers.phone, `%${searchParams.search}%`),
          ilike(buyers.email, `%${searchParams.search}%`)
        )!
      );
    }

    if (searchParams.city) {
      conditions.push(eq(buyers.city, searchParams.city as any));
    }

    if (searchParams.propertyType) {
      conditions.push(eq(buyers.propertyType, searchParams.propertyType as any));
    }

    if (searchParams.status) {
      conditions.push(eq(buyers.status, searchParams.status as any));
    }

    if (searchParams.timeline) {
      conditions.push(eq(buyers.timeline, searchParams.timeline as any));
    }

    // Get all matching buyers (not paginated)
    const results = await db
      .select()
      .from(buyers)
      .where(and(...conditions))
      .orderBy(desc(buyers.updatedAt));

    // Generate CSV content
    const headers = [
      'Full Name',
      'Email',
      'Phone',
      'City',
      'Property Type',
      'BHK',
      'Purpose',
      'Budget Min',
      'Budget Max',
      'Timeline',
      'Source',
      'Status',
      'Notes',
      'Tags',
      'Created At',
      'Updated At',
    ];

    const csvRows = results.map(buyer => [
      buyer.fullName,
      buyer.email || '',
      buyer.phone,
      buyer.city,
      buyer.propertyType,
      buyer.bhk || '',
      buyer.purpose,
      buyer.budgetMin || '',
      buyer.budgetMax || '',
      buyer.timeline,
      buyer.source,
      buyer.status,
      buyer.notes || '',
      buyer.tags?.join(', ') || '',
      buyer.createdAt.toISOString(),
      buyer.updatedAt.toISOString(),
    ]);

    const csvContent = [headers, ...csvRows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `leads-${date}.csv`;

    return {
      content: csvContent,
      filename,
      contentType: 'text/csv',
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to export CSV');
  }
}
