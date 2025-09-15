# LeadFlow - Professional Real Estate Lead Management System

A modern, full-stack buyer lead intake and management application built with Next.js 15, TypeScript, Supabase, and Drizzle ORM. Designed specifically for real estate professionals to track and manage buyer leads efficiently.

## 🚀 Features

- 🔐 **Secure Authentication** - Magic link authentication with Supabase
- 📝 **Lead Management** - Create, view, edit, and track buyer leads
- 🔍 **Advanced Filtering** - Search and filter leads by multiple criteria
- 📊 **Professional Dashboard** - Real estate-focused UI with key metrics
- 📈 **Activity History** - Track all changes to leads with detailed history
- 📁 **CSV Import/Export** - Bulk import and export lead data
- 🎯 **Status Management** - Quick status updates with dropdown actions
- 🔒 **Rate Limiting** - Built-in rate limiting for API endpoints
- ✅ **Validation** - Client and server-side validation with Zod
- 🎨 **Modern UI** - Professional real estate interface with shadcn/ui components
- 📱 **Responsive Design** - Works seamlessly on all devices
- 👑 **Admin Controls** - Role-based access control for administrators

## 🛠 Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **ORM:** Drizzle ORM
- **Authentication:** Supabase Auth (Magic Links)
- **Validation:** Zod
- **UI Components:** shadcn/ui + Tailwind CSS
- **Data Tables:** TanStack Table v8
- **Forms:** React Hook Form
- **Testing:** Vitest + Testing Library

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- PostgreSQL database (via Supabase)

## ⚙️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd leaflow-web
npm install
```

### 2. Environment Configuration

Copy the environment template and fill in your values:

```bash
cp env.template .env.local
```

**Required Environment Variables:**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database URL (for Drizzle)
DATABASE_URL=postgresql://user:password@host:port/database

# Next.js Configuration
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=http://localhost:3000
```

**Getting Supabase Credentials:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing one
3. Go to Settings → API
4. Copy the Project URL and anon key
5. Copy the service_role key (keep this secret!)

### 3. Database Setup

**Run Database Migrations:**

```bash
# Generate migration files
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations (if using migration files)
npm run db:migrate
```

**Database Schema:**
- `buyers` table: Main lead data with ownership tracking
- `buyer_history` table: Audit trail for all lead changes
- Enums: City, PropertyType, BHK, Purpose, Timeline, Source, Status

### 4. Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The application will be available at `http://localhost:3000`

### 5. Admin Setup (Optional)

To set up an admin user:

1. Go to your Supabase Dashboard → Authentication → Users
2. Find your user and click "Edit"
3. In the "User Metadata" section, add:
   ```json
   {
     "role": "admin"
   }
   ```
4. Or use the email `admin@leadflow.com` (demo admin)

See `ADMIN_SETUP.md` for detailed instructions.

## 🏗 Architecture & Design Notes

### Validation Strategy

**Client-Side Validation:**
- Zod schemas in `src/lib/validations/buyer.ts`
- React Hook Form integration with `zodResolver`
- Real-time validation feedback
- Prevents invalid submissions

**Server-Side Validation:**
- Same Zod schemas used in Server Actions
- Additional business logic validation
- Database constraint enforcement
- Security-first approach

**Shared Schemas:**
```typescript
// Used on both client and server
export const buyerSchema = z.object({
  fullName: z.string().min(1).max(80),
  email: z.string().email().optional(),
  // ... other fields
});
```

### SSR vs Client-Side Rendering

**Server-Side Rendered (SSR):**
- `/buyers` - Lead list with filters and pagination
- `/buyers/[id]` - Individual lead details
- Authentication checks and user context
- SEO-friendly pages

**Client-Side Rendered:**
- Form interactions and real-time updates
- Table sorting and filtering
- CSV import/export modals
- Interactive components

**Hybrid Approach:**
- Initial page load: SSR for fast loading
- User interactions: Client-side for responsiveness
- Progressive enhancement pattern

### Ownership & Authorization

**Ownership Enforcement:**
- Each buyer record has an `ownerId` field
- Users can only edit their own leads
- Database-level access control in queries

**Admin Privileges:**
- Admins can view and edit all leads
- Role checking via user metadata
- Graceful fallback for regular users

**Implementation:**
```typescript
// Authorization helpers in src/lib/auth.ts
export function canEditBuyer(user: any, buyerOwnerId: string): boolean {
  const isAdmin = user?.user_metadata?.role === 'admin' || 
                  user?.email === 'admin@leadflow.com';
  return isAdmin || user?.id === buyerOwnerId;
}
```

### Data Flow

1. **Authentication:** Supabase handles magic link auth
2. **Authorization:** Custom helpers check permissions
3. **Data Fetching:** Drizzle ORM with server components
4. **State Management:** React state + URL params for filters
5. **Mutations:** Server Actions with optimistic updates

## 📊 Database Schema

### Buyers Table
```sql
CREATE TABLE buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  full_name VARCHAR(80) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(15) NOT NULL,
  city VARCHAR(20) NOT NULL,
  property_type VARCHAR(20) NOT NULL,
  bhk VARCHAR(10),
  purpose VARCHAR(10) NOT NULL,
  budget_min INTEGER,
  budget_max INTEGER,
  timeline VARCHAR(20) NOT NULL,
  source VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'New',
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Buyer History Table
```sql
CREATE TABLE buyer_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES buyers(id),
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  diff TEXT NOT NULL, -- JSON string of changes
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run specific test file
npx vitest src/lib/validations/__tests__/buyer.test.ts
```

**Test Coverage:**
- Zod validation schemas
- Utility functions
- Form validation logic
- Budget constraint validation

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication routes
│   ├── buyers/            # Lead management pages
│   ├── login/             # Login page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── buyers-list.tsx    # Main lead table
│   ├── buyer-detail.tsx   # Lead detail view
│   └── navigation.tsx     # Navigation bar
├── lib/                   # Utility libraries
│   ├── actions/           # Server Actions
│   ├── auth.ts            # Auth helpers
│   ├── db/                # Database schema & client
│   ├── supabase/          # Supabase configuration
│   └── validations/       # Zod schemas
└── test/                  # Test setup
```

- Configure build command: `npm run build`
- Set start command: `npm start`

## ✅ What's Implemented

### ✅ Core Features
- [x] Magic link authentication
- [x] Lead CRUD operations
- [x] Advanced filtering and search
- [x] Pagination and sorting
- [x] CSV import/export
- [x] Activity history tracking
- [x] Status management
- [x] Ownership enforcement
- [x] Admin role support
- [x] Rate limiting
- [x] Form validation
- [x] Responsive design
- [x] Professional UI/UX

### ✅ Technical Implementation
- [x] Next.js 15 App Router
- [x] TypeScript throughout
- [x] Drizzle ORM integration
- [x] Supabase authentication
- [x] Server Actions
- [x] Zod validation
- [x] TanStack Table
- [x] React Hook Form
- [x] Tailwind CSS + shadcn/ui
- [x] Error boundaries
- [x] Loading states
- [x] Unit tests
- [x] Production build

## ⏭️ What's Skipped (and Why)

### Features Intentionally Skipped
- **Email Notifications:** Focused on core lead management first
- **Advanced Analytics:** Basic metrics provided, detailed analytics can be added later
- **File Uploads:** Property images not required for MVP
- **Multi-tenant:** Single organization focus for simplicity
- **Real-time Updates:** Server Actions provide sufficient reactivity
- **Advanced Permissions:** Simple owner/admin model covers most use cases

### Technical Decisions
- **No Redux/Zustand:** React state + URL params sufficient for current scope
- **No GraphQL:** RESTful Server Actions simpler for this use case
- **No Docker:** Standard Node.js deployment preferred
- **No CI/CD:** Manual deployment acceptable for initial version

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm start              # Start production server

# Database
npm run db:generate    # Generate migration files
npm run db:push        # Push schema to database
npm run db:migrate     # Run migrations
npm run db:studio      # Open Drizzle Studio

# Testing & Quality
npm test               # Run tests
npm run test:ui        # Run tests with UI
npm run lint           # Run ESLint
```



## 📄 License

This project is private and proprietary. All rights reserved.

---

**LeadFlow** - Streamline your real estate lead management with professional tools designed for success. 🏠✨
