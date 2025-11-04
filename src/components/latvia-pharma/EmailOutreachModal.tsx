'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

interface EmailOutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
  recipientName: string;
  productSku?: string;
  productName?: string;
}

export function EmailOutreachModal({
  isOpen,
  onClose,
  recipientEmail,
  recipientName,
  productSku,
  productName,
}: EmailOutreachModalProps) {
  const [subject, setSubject] = useState(
    productName 
      ? `Inquiry about ${productName} (SKU: ${productSku})`
      : 'Product Supply Inquiry'
  );
  const [message, setMessage] = useState(`Dear ${recipientName},

I hope this email finds you well. We are interested in establishing a business relationship with your company for pharmaceutical supplies.

${productName ? `We are particularly interested in your supply capabilities for ${productName} (SKU: ${productSku}).` : ''}

We would appreciate if you could provide us with:
- Current pricing and availability
- Minimum order quantities
- Delivery timelines
- Payment terms
- Any certifications or quality standards

We look forward to hearing from you soon.

Best regards,
[Your Name]
[Your Company]
[Your Contact Information]`);

  const [ccEmail, setCcEmail] = useState('');
  const [attachmentNote, setAttachmentNote] = useState('');

  const sendEmail = trpc.email.sendOutreach.useMutation({
    onSuccess: () => {
      alert('Email sent successfully!');
      onClose();
    },
    onError: (error) => {
      alert(`Failed to send email: ${error.message}`);
    },
  });

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) {
      alert('Please fill in subject and message');
      return;
    }

    sendEmail.mutate({
      to: recipientEmail,
      cc: ccEmail || undefined,
      subject,
      message,
      attachmentNote: attachmentNote || undefined,
      metadata: {
        recipientName,
        productSku,
        productName,
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Send Email Outreach</DialogTitle>
          <DialogDescription>
            Compose and send an email to {recipientName} ({recipientEmail})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 px-6 py-4">
          <div>
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              value={`${recipientName} <${recipientEmail}>`}
              disabled
              className="bg-muted"
            />
          </div>

          <div>
            <Label htmlFor="cc">CC (Optional)</Label>
            <Input
              id="cc"
              type="email"
              placeholder="cc@example.com"
              value={ccEmail}
              onChange={(e) => setCcEmail(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Email message"
              value={message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
              rows={8}
              className="font-mono text-sm min-h-[200px] resize-none"
            />
          </div>

          <div>
            <Label htmlFor="attachment">Attachment Note (Optional)</Label>
            <Input
              id="attachment"
              placeholder="Note about any attachments you plan to send separately"
              value={attachmentNote}
              onChange={(e) => setAttachmentNote(e.target.value)}
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This email will be sent from your configured email account. Make sure your SMTP settings are properly configured.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="border-t px-6 py-4 bg-background">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={sendEmail.isPending}
          >
            {sendEmail.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}