import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import nodemailer from 'nodemailer';

// Email configuration - In production, these should come from environment variables
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  from: process.env.SMTP_FROM || 'noreply@healthcare-supply.com',
};

export const emailRouter = router({
  // Send outreach email to supplier
  sendOutreach: publicProcedure
    .input(
      z.object({
        to: z.string().email(),
        cc: z.string().email().optional(),
        subject: z.string(),
        message: z.string(),
        attachmentNote: z.string().optional(),
        metadata: z.object({
          recipientName: z.string(),
          productSku: z.string().optional(),
          productName: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        let info: any;
        
        // Check if SMTP is configured
        if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
          // For development/demo purposes, just log the email
          console.log('=== EMAIL SIMULATION (No SMTP configured) ===');
          console.log('To:', input.to);
          console.log('CC:', input.cc || 'None');
          console.log('Subject:', input.subject);
          console.log('Message:');
          console.log(input.message);
          console.log('==========================================');
          
          // Simulate success
          info = { messageId: `demo-${Date.now()}` };
        } else {
          // Create transporter
          const transporter = nodemailer.createTransport(EMAIL_CONFIG);

          // Verify transporter connection
          await transporter.verify();

          // Prepare email options
          const mailOptions = {
            from: EMAIL_CONFIG.from,
            to: input.to,
            cc: input.cc,
            subject: input.subject,
            text: input.message,
            html: `<pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${input.message}</pre>`,
          };

          // Send email
          info = await transporter.sendMail(mailOptions);
        }

        // Log email activity in database (if table exists)
        try {
          await ctx.db.$executeRaw`
            INSERT INTO "EmailLog" (
              "to",
              "cc",
              "subject",
              "status",
              "metadata",
              "sentAt"
            ) VALUES (
              ${input.to},
              ${input.cc || null},
              ${input.subject},
              'sent',
              ${JSON.stringify(input.metadata)}::jsonb,
              NOW()
            )
          `;
        } catch (logError) {
          console.log('Email log table not found, skipping logging');
        }

        return {
          success: true,
          messageId: info.messageId,
          message: 'Email sent successfully',
        };
      } catch (error) {
        console.error('Email sending failed:', error);
        
        // Log failed email attempt
        try {
          await ctx.db.$executeRaw`
            INSERT INTO "EmailLog" (
              "to",
              "cc",
              "subject",
              "status",
              "error",
              "metadata",
              "sentAt"
            ) VALUES (
              ${input.to},
              ${input.cc || null},
              ${input.subject},
              'failed',
              ${error instanceof Error ? error.message : 'Unknown error'},
              ${JSON.stringify(input.metadata)}::jsonb,
              NOW()
            )
          `;
        } catch (logError) {
          console.error('Failed to log email error:', logError);
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to send email',
        });
      }
    }),

  // Get email templates
  getTemplates: publicProcedure
    .query(async ({ ctx }) => {
      return {
        templates: [
          {
            id: 'initial-outreach',
            name: 'Initial Supplier Outreach',
            subject: 'Partnership Inquiry - [Product Name]',
            body: `Dear [Supplier Name],

We are interested in establishing a business relationship with your company for pharmaceutical supplies.

We would appreciate if you could provide us with:
- Current pricing and availability
- Minimum order quantities
- Delivery timelines
- Payment terms
- Any certifications or quality standards

Best regards,
[Your Name]`,
          },
          {
            id: 'follow-up',
            name: 'Follow-up Email',
            subject: 'Following up on our inquiry',
            body: `Dear [Supplier Name],

I hope this email finds you well. I wanted to follow up on my previous email regarding [Product Name].

We are still very interested in working with your company and would appreciate a response at your earliest convenience.

Best regards,
[Your Name]`,
          },
        ],
      };
    }),
});