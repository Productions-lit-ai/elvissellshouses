import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, User, Shield, FileText, Home, Briefcase } from 'lucide-react';
import { notifyMessage } from '@/lib/notifications';

// Admin email that guests can message
const ADMIN_CONTACT_EMAIL = 'elvissellshouses@gmail.com';

interface AdminProfile {
  user_id: string;
  email: string;
  full_name: string | null;
}

interface Message {
  id: string;
  content: string;
  is_from_admin: boolean;
  created_at: string;
  sender_id: string;
  recipient_id: string | null;
}

const GuestDashboard: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [submissions, setSubmissions] = useState({ buy: 0, sell: 0, work: 0 });
  const [adminProfiles, setAdminProfiles] = useState<AdminProfile[]>([]);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/signin');
    } else if (!isLoading && isAdmin) {
      navigate('/admin');
    }
  }, [user, isAdmin, isLoading, navigate]);

  // Fetch admin profiles, submissions, and messages
  useEffect(() => {
    if (!user) return;

    const fetchAdminProfiles = async () => {
      const { data: adminEmails } = await supabase.from('admin_emails').select('email');
      if (adminEmails) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email, full_name')
          .in('email', adminEmails.map(a => a.email));
        
        if (profiles) {
          setAdminProfiles(profiles);
          const primaryAdmin = profiles.find(p => p.email === ADMIN_CONTACT_EMAIL);
          if (primaryAdmin) {
            setAdminUserId(primaryAdmin.user_id);
          }
        }
      }
    };

    const fetchSubmissions = async () => {
      const [buyRes, sellRes, workRes] = await Promise.all([
        supabase.from('buy_requests').select('id').eq('user_id', user.id),
        supabase.from('sell_requests').select('id').eq('user_id', user.id),
        supabase.from('work_with_me_requests').select('id').eq('user_id', user.id),
      ]);
      setSubmissions({
        buy: buyRes.data?.length || 0,
        sell: sellRes.data?.length || 0,
        work: workRes.data?.length || 0,
      });
    };

    const fetchMessages = async () => {
      // Fetch messages where user is either sender or recipient
      const { data } = await supabase
        .from('messages')
        .select('id, content, is_from_admin, created_at, sender_id, recipient_id')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: true });
      
      if (data) {
        setConversationMessages(data);
      }
    };

    fetchAdminProfiles();
    fetchSubmissions();
    fetchMessages();
  }, [user]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('guest-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Only add if this message is relevant to this user
          if (newMsg.sender_id === user.id || newMsg.recipient_id === user.id) {
            setConversationMessages((prev) => {
              // Avoid duplicates
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationMessages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !user || !adminUserId) return;
    setIsSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        recipient_id: adminUserId,
        content: message.trim(),
        is_from_admin: false,
      });
      if (error) throw error;

      // Get user profile for sender info
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .single();

      // Send notification email to admin
      notifyMessage({
        senderName: profile?.full_name || 'Guest User',
        senderEmail: profile?.email || user.email || 'Unknown',
        messageContent: message.trim(),
        conversationUrl: `${window.location.origin}/admin`,
      });
      
      toast({ title: 'Message sent!', description: 'Elvis will respond soon.' });
      setMessage('');
    } catch {
      toast({ title: 'Error', description: 'Failed to send message.', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;

  return (
    <div className="min-h-screen bg-background pt-20 md:pt-8 pb-16">
      <div className="container max-w-3xl px-4">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your activity summary.</p>
        </div>
        
        {/* Submission Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{submissions.buy}</p>
                <p className="text-muted-foreground text-sm">Buy Requests</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{submissions.sell}</p>
                <p className="text-muted-foreground text-sm">Sell Requests</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{submissions.work}</p>
                <p className="text-muted-foreground text-sm">Work Apps</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messaging Section */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-semibold text-foreground">Messages with Elvis</h2>
                <p className="text-sm text-muted-foreground">Private & secure conversation</p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="h-[350px] p-4" ref={scrollRef}>
            {conversationMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground/70">Send a message to start the conversation</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversationMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.is_from_admin ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        msg.is_from_admin
                          ? 'bg-muted text-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.is_from_admin ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                        {msg.is_from_admin ? 'Elvis' : 'You'} • {new Date(msg.created_at).toLocaleString([], { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t border-border bg-muted/30">
            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="min-h-[44px] max-h-[120px] resize-none"
                rows={1}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isSending || !message.trim() || !adminUserId}
                className="shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send • Your messages are private and secure
            </p>
          </div>
        </div>

        {/* Admin Contact Info */}
        {adminProfiles.length > 0 && (
          <div className="mt-6 bg-muted/50 rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-3">Admin Contacts</p>
            <div className="flex flex-wrap gap-3">
              {adminProfiles.map((admin) => (
                <div key={admin.user_id} className="flex items-center gap-2 bg-card px-3 py-2 rounded-lg">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{admin.full_name || admin.email}</span>
                  {admin.email === ADMIN_CONTACT_EMAIL && (
                    <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">Primary</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestDashboard;
