# Admin Setup Guide

This guide explains how to set up and use the admin features for managing payment settings and tax processing.

## Environment Variables

Add these to your `.env` file:

```env
# Admin API Key (change this to a secure random string)
VITE_ADMIN_API_KEY=your-secret-admin-key-change-this

# Supabase Configuration (should already exist)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-key
```

## Database Setup

Run the migration file to create the required tables:

```sql
-- Run this in your Supabase SQL editor
-- File: supabase/migrations/20241208_admin_tables.sql
```

This creates:
- `admin_settings` table - Stores payment configuration
- `tax_processing` table - Stores tax payment records

## Supabase Edge Functions Setup

### 1. Deploy Admin Settings Function

```bash
supabase functions deploy admin-settings
```

Set environment variables in Supabase Dashboard:
- `ADMIN_API_KEY` - Must match `VITE_ADMIN_API_KEY` in your frontend
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

### 2. Deploy Tax Processing Function

```bash
supabase functions deploy process-tax
```

Set environment variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

## Accessing Admin Features

### Admin Dashboard
Navigate to: `/admin`

Features:
- Set profit collection wallet address
- Enable/disable payment processing
- Configure service fee percentage
- Set min/max payment amounts
- Enable/disable tax processing

### Tax Processing Page
Navigate to: `/tax-processing`

Features:
- View all tax payment records
- Filter by status (pending, processing, processed, failed, cancelled)
- Search by Payer ID, Wallet Address, or Transaction ID
- Update record status
- Process pending payments

## API Endpoints

### Admin Settings API

**GET** `/functions/v1/admin-settings`
- Get current admin settings
- Requires: `Authorization: Bearer {ADMIN_API_KEY}`

**POST** `/functions/v1/admin-settings`
- Update admin settings
- Requires: `Authorization: Bearer {ADMIN_API_KEY}`
- Body:
```json
{
  "profit_wallet_address": "Solana wallet address",
  "payment_enabled": true,
  "service_fee_percentage": 2.5,
  "min_payment_amount": 1000,
  "max_payment_amount": 100000000,
  "tax_processing_enabled": true
}
```

### Tax Processing API

**GET** `/functions/v1/process-tax?status={status}&limit={limit}&offset={offset}`
- Get tax processing records
- Query params: `status` (all, pending, processing, processed, failed, cancelled), `limit`, `offset`

**POST** `/functions/v1/process-tax`
- Create new tax processing record
- Body:
```json
{
  "payer_id": "payer identification",
  "wallet_address": "Solana wallet address",
  "tax_type": "paye|vat|cit|withholding",
  "tax_amount": 10000,
  "income_amount": 50000,
  "transaction_id": "unique transaction ID",
  "status": "pending",
  "notes": "Optional notes"
}
```

**PATCH** `/functions/v1/process-tax`
- Update tax processing record status
- Body:
```json
{
  "id": 1,
  "status": "processed",
  "notes": "Optional notes"
}
```

## Security Notes

1. **Admin API Key**: Keep your `ADMIN_API_KEY` secure and never commit it to version control
2. **Service Role Key**: The Supabase service role key has full database access - keep it secure
3. **Wallet Address**: Validate Solana wallet addresses before saving
4. **Rate Limiting**: Consider adding rate limiting to admin endpoints in production

## Nigerian Tax Law 2026 Compliance

The tax calculator now uses the new Nigerian tax rates effective January 1, 2026:

### Personal Income Tax (PAYE)
- First ₦800,000: 0%
- Next ₦2,200,000: 15%
- Next ₦9,000,000: 18%
- Next ₦13,000,000: 21%
- Next ₦25,000,000: 23%
- Above ₦50,000,000: 25%

### VAT
- Rate: 7.5% (unchanged)
- Expanded exemptions: food, rent, education, healthcare, public transport

### Company Income Tax (CIT)
- Small companies (< ₦25m): 0%
- Medium companies (₦25m - ₦100m): 20%
- Large companies (> ₦100m): 30%

### Withholding Tax
- Dividends, Interest, Rent: 10%
- Contracts, Professional Services: 5%

## Troubleshooting

### Admin Dashboard Not Loading
- Check that `VITE_ADMIN_API_KEY` is set in `.env`
- Verify Supabase function is deployed and environment variables are set
- Check browser console for errors

### Tax Processing Records Not Showing
- Verify `tax_processing` table exists in database
- Check Supabase function logs for errors
- Ensure service role key has proper permissions

### Settings Not Saving
- Verify admin API key matches between frontend and backend
- Check Supabase function logs
- Ensure `admin_settings` table exists and has proper constraints

