import { describe, it, expect } from 'vitest';
import { buyerSchema, validateBudgetConstraints } from '../buyer';

describe('buyerSchema', () => {
  it('should validate a complete buyer object', () => {
    const validBuyer = {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '9876543210',
      city: 'Chandigarh',
      propertyType: 'Apartment',
      bhk: '2',
      purpose: 'Buy',
      budgetMin: 5000000,
      budgetMax: 10000000,
      timeline: '3-6m',
      source: 'Website',
      notes: 'Interested in 2BHK apartment',
      tags: ['urgent', 'premium'],
    };

    const result = buyerSchema.safeParse(validBuyer);
    expect(result.success).toBe(true);
  });

  it('should require BHK for Apartment property type', () => {
    const buyerWithoutBHK = {
      fullName: 'John Doe',
      phone: '9876543210',
      city: 'Chandigarh',
      propertyType: 'Apartment',
      purpose: 'Buy',
      timeline: '3-6m',
      source: 'Website',
    };

    const result = buyerSchema.safeParse(buyerWithoutBHK);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['bhk']);
    }
  });

  it('should require BHK for Villa property type', () => {
    const buyerWithoutBHK = {
      fullName: 'John Doe',
      phone: '9876543210',
      city: 'Chandigarh',
      propertyType: 'Villa',
      purpose: 'Buy',
      timeline: '3-6m',
      source: 'Website',
    };

    const result = buyerSchema.safeParse(buyerWithoutBHK);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['bhk']);
    }
  });

  it('should not require BHK for other property types', () => {
    const buyerWithoutBHK = {
      fullName: 'John Doe',
      phone: '9876543210',
      city: 'Chandigarh',
      propertyType: 'Plot',
      purpose: 'Buy',
      timeline: '3-6m',
      source: 'Website',
    };

    const result = buyerSchema.safeParse(buyerWithoutBHK);
    expect(result.success).toBe(true);
  });

  it('should validate budget constraints', () => {
    const buyerWithInvalidBudget = {
      fullName: 'John Doe',
      phone: '9876543210',
      city: 'Chandigarh',
      propertyType: 'Apartment',
      bhk: '2',
      purpose: 'Buy',
      budgetMin: 10000000,
      budgetMax: 5000000, // Max is less than min
      timeline: '3-6m',
      source: 'Website',
    };

    const result = buyerSchema.safeParse(buyerWithInvalidBudget);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['budgetMax']);
    }
  });

  it('should accept valid budget ranges', () => {
    const buyerWithValidBudget = {
      fullName: 'John Doe',
      phone: '9876543210',
      city: 'Chandigarh',
      propertyType: 'Apartment',
      bhk: '2',
      purpose: 'Buy',
      budgetMin: 5000000,
      budgetMax: 10000000,
      timeline: '3-6m',
      source: 'Website',
    };

    const result = buyerSchema.safeParse(buyerWithValidBudget);
    expect(result.success).toBe(true);
  });

  it('should validate required fields', () => {
    const incompleteBuyer = {
      fullName: '',
      phone: '',
      city: '',
      propertyType: '',
      purpose: '',
      timeline: '',
      source: '',
    };

    const result = buyerSchema.safeParse(incompleteBuyer);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});

describe('validateBudgetConstraints', () => {
  it('should return true when max budget is greater than min budget', () => {
    expect(validateBudgetConstraints(5000000, 10000000)).toBe(true);
  });

  it('should return true when max budget equals min budget', () => {
    expect(validateBudgetConstraints(5000000, 5000000)).toBe(true);
  });

  it('should return false when max budget is less than min budget', () => {
    expect(validateBudgetConstraints(10000000, 5000000)).toBe(false);
  });

  it('should return true when only min budget is provided', () => {
    expect(validateBudgetConstraints(5000000, null)).toBe(true);
  });

  it('should return true when only max budget is provided', () => {
    expect(validateBudgetConstraints(null, 10000000)).toBe(true);
  });

  it('should return true when neither budget is provided', () => {
    expect(validateBudgetConstraints(null, null)).toBe(true);
  });
});
