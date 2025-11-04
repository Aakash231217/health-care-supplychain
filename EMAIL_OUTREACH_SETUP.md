# Email Outreach Setup Guide

## Overview
This guide explains how to set up and use the email outreach feature in the batch supplier matching system.

## Installation

First, install the required dependency:

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

## Environment Variables

Add the following to your `.env` file:

```env
# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Healthcare Supply Chain <noreply@healthcare-supply.com>"
```

### Gmail Setup
1. Go to your Google Account settings
2. Enable 2-factor authentication
3. Generate an app-specific password:
   - Go to https://myaccount.google.com/apppasswords
   - Create a new app password for "Mail"
   - Use this password as SMTP_PASS

### Other Email Providers

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Outlook/Office365:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

## Database Setup

Create an email log table to track sent emails:

```sql
CREATE TABLE "EmailLog" (
  id SERIAL PRIMARY KEY,
  "to" VARCHAR(255) NOT NULL,
  cc VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL,
  error TEXT,
  metadata JSONB,
  "sentAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Or add to your Prisma schema:

```prisma
model EmailLog {
  id       Int      @id @default(autoincrement())
  to       String
  cc       String?
  subject  String
  status   String   // 'sent' or 'failed'
  error    String?  @db.Text
  metadata Json?
  sentAt   DateTime @default(now())
}
```

## Features

### 1. Batch Supplier Matching
- Matches products from Excel imports with Latvia registry suppliers
- Shows supplier email addresses when available
- Allows sending emails directly from the match results

### 2. Email Outreach Modal
- Pre-filled recipient information
- Product context included when applicable
- CC option for additional recipients
- Rich text editor for composing emails
- Attachment notes for reference

### 3. Email Templates (Coming Soon)
The system includes pre-defined templates:
- Initial supplier outreach
- Follow-up emails
- Price inquiry
- Product availability check

## Usage

1. **Run Batch Match**
   - Go to Dashboard > Suppliers
   - Click "Start Batch Match"
   - Select the number of products to process

2. **View Results**
   - Click "View Details" on any matched product
   - See list of suppliers with their contact information

3. **Send Email**
   - Click "Send Email" next to any supplier with an email address
   - Compose your message in the modal
   - Click "Send Email" to dispatch

## Troubleshooting

### Email Not Sending
1. Check SMTP credentials in .env file
2. Verify app password (not regular password) for Gmail
3. Check firewall/antivirus blocking SMTP ports
4. Look at server logs for specific error messages

### Missing Email Addresses
- Run the vendor population script to link Latvia registry with vendors:
  ```bash
  npm run populate:vendors
  ```

### SMTP Connection Errors
- Try different ports: 587 (TLS), 465 (SSL), or 25 (unencrypted)
- Check if your ISP blocks SMTP ports
- Use a VPN if necessary

## Security Considerations

1. **Never commit .env file** with real credentials
2. Use app-specific passwords, not main account passwords
3. Implement rate limiting to prevent abuse
4. Add authentication to email sending endpoints in production
5. Consider using email queuing for bulk sends

## Future Enhancements

1. **Email Templates System**
   - Save custom templates
   - Variable substitution
   - Template categories

2. **Bulk Email Campaigns**
   - Send to multiple suppliers at once
   - Schedule emails
   - Track open rates

3. **CRM Integration**
   - Sync with HubSpot, Salesforce
   - Track communications history
   - Lead scoring

4. **Analytics Dashboard**
   - Email performance metrics
   - Response rates
   - Supplier engagement tracking