# Quick Email Setup Guide

## Setup Steps

1. **Install Dependencies**
   ```bash
   npm install nodemailer @types/nodemailer
   ```

2. **Add Email Configuration to .env**
   ```env
   # For Gmail
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-specific-password
   SMTP_FROM="Healthcare Supply <your-email@gmail.com>"
   ```

3. **Run Email Enhancement Script** (Optional)
   ```bash
   # First populate vendors from Latvia data
   npm run populate:vendors
   
   # Then enhance with real emails (if you have Google Search API configured)
   npm run enhance:emails
   ```

## Manual Email Addition

If you don't have Google Search API, you can manually add known vendor emails:

```sql
-- Add some known Latvia pharmaceutical vendor emails
UPDATE "Vendor" SET email = 'info@repharm.lv' WHERE name LIKE '%Repharm%';
UPDATE "Vendor" SET email = 'office@recipeplus.lv' WHERE name LIKE '%Recipe Plus%';
UPDATE "Vendor" SET email = 'info@tamro.lv' WHERE name LIKE '%Tamro%';
UPDATE "Vendor" SET email = 'info@euroaptieka.lv' WHERE name LIKE '%Euroaptieka%';
UPDATE "Vendor" SET email = 'info@grindeks.lv' WHERE name LIKE '%Grindeks%';
UPDATE "Vendor" SET email = 'info@olainfarm.lv' WHERE name LIKE '%Olainfarm%';
UPDATE "Vendor" SET email = 'info@silvanols.lv' WHERE name LIKE '%Silvanols%';
```

## Features Added

1. **Email Display in Batch Supplier Matching**
   - Shows vendor emails when viewing supplier details
   - Email addresses are fetched from the Vendor table

2. **Email Outreach Modal**
   - Click "Send Email" button next to any supplier with an email
   - Pre-filled with recipient details and product information
   - Compose professional outreach emails
   - CC option for additional recipients

3. **Email Sending**
   - Currently in demo mode (logs to console)
   - Full implementation ready once nodemailer is installed
   - Tracks sent emails in database (optional EmailLog table)

## Testing Without SMTP

The system will work in demo mode if SMTP is not configured:
- Emails will be logged to the console
- You can see the full email that would be sent
- No actual emails are sent

## Next Steps

1. Install nodemailer
2. Configure SMTP settings in .env
3. Test with a real email
4. Consider adding email templates
5. Implement bulk email campaigns