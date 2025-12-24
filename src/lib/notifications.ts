import { supabase } from '@/integrations/supabase/client';

interface SignupNotificationData {
  fullName?: string;
  email: string;
  timestamp?: string;
}

interface MessageNotificationData {
  senderName?: string;
  senderEmail: string;
  messageContent: string;
  conversationUrl: string;
}

interface FormSubmissionData {
  fullName: string;
  email: string;
  formType: string;
  formFields: Record<string, string>;
}

type NotificationType = 'signup' | 'message' | 'form_submission';

interface NotificationPayload {
  type: NotificationType;
  data: SignupNotificationData | MessageNotificationData | FormSubmissionData;
}

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-notification', {
      body: payload,
    });

    if (error) {
      console.error('Failed to send notification:', error);
    }
  } catch (err) {
    // Log but don't throw - notifications shouldn't break main functionality
    console.error('Notification error:', err);
  }
}

export async function notifySignup(data: SignupNotificationData): Promise<void> {
  await sendNotification({
    type: 'signup',
    data: {
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
    },
  });
}

export async function notifyMessage(data: MessageNotificationData): Promise<void> {
  await sendNotification({
    type: 'message',
    data,
  });
}

export async function notifyFormSubmission(data: FormSubmissionData): Promise<void> {
  await sendNotification({
    type: 'form_submission',
    data,
  });
}
