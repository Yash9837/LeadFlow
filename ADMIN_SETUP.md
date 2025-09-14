# Admin Role Setup Guide

## How to Set Up Admin Users in LeadFlow

### Method 1: Supabase Auth Metadata (Recommended)

1. **Go to your Supabase Dashboard**
2. **Navigate to Authentication > Users**
3. **Find the user you want to make an admin**
4. **Click on the user to edit**
5. **In the "Raw user meta data" section, add:**
   ```json
   {
     "role": "admin"
   }
   ```
6. **Save the changes**

### Method 2: App Metadata (Alternative)

1. **Go to your Supabase Dashboard**
2. **Navigate to Authentication > Users**
3. **Find the user you want to make an admin**
4. **Click on the user to edit**
5. **In the "Raw app meta data" section, add:**
   ```json
   {
     "role": "admin"
   }
   ```
6. **Save the changes**

### Method 3: Demo Admin Email (For Testing)

The application includes a demo admin email for testing purposes:
- **Email**: `admin@leadflow.com`
- **Any user with this email will automatically have admin privileges**

## Admin Features

Once a user has admin role, they will have access to:

### ✅ **Full Access to All Leads**
- Can view, edit, and delete **any** buyer lead (not just their own)
- Can see leads from all users in the system
- Admin badge appears in the navigation bar

### ✅ **Enhanced CSV Operations**
- Can import/export **all** leads in the system
- Can see leads from all users in exports

### ✅ **Universal Search & Filtering**
- Can search and filter across **all** leads
- Can access any lead detail page regardless of ownership

### ✅ **Full CRUD Operations**
- Can create, read, update, and delete any lead
- Can change status of any lead
- Can view activity history for any lead

## Security Notes

- **Admin privileges are checked on every request**
- **Server-side validation ensures proper authorization**
- **Admin status is determined by Supabase user metadata**
- **No client-side admin status can be spoofed**

## Testing Admin Features

1. **Set up an admin user** using one of the methods above
2. **Log in with the admin account**
3. **Look for the "Admin" badge** in the navigation bar
4. **Create some leads with different users**
5. **Verify the admin can see and edit all leads**

## Removing Admin Access

To remove admin access from a user:
1. **Go to Supabase Dashboard > Authentication > Users**
2. **Find the user**
3. **Remove the `role: "admin"` from their metadata**
4. **Save the changes**

The user will immediately lose admin privileges on their next request.
