import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, CheckCircle, Mail, User, Shield } from 'lucide-react';

// Admin email that guests can message
const ADMIN_CONTACT_EMAIL = 'elvissellshouses@gmail.com';

interface AdminProfile {
  user_id: string;
  email: string;
  full_name: string | null;
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
  const [conversationMessages, setConversationMessages] = useState<Array<{ id: string; content: string; is_from_admin: boolean; created_at: string }>>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/signin');
    } else if (!isLoading && isAdmin) {
      navigate('/admin');
    }
  }, [user, isAdmin, isLoading, navigate]);

  // Fetch admin profiles and user's submissions
  useEffect(() => {
    if (user) {
      // Fetch admin profiles
      const fetchAdminProfiles = async () => {
        const { data: adminEmails } = await supabase.from('admin_emails').select('email');
        if (adminEmails) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, email, full_name')
            .in('email', adminEmails.map(a => a.email));
          
          if (profiles) {
            setAdminProfiles(profiles);
            // Find the primary admin (elvissellshouses@gmail.com) for messaging
            const primaryAdmin = profiles.find(p => p.email === ADMIN_CONTACT_EMAIL);
            if (primaryAdmin) {
              setAdminUserId(primaryAdmin.user_id);
            }
          }
        }
      };

      // Fetch user's submissions
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

      // Fetch conversation with admin
      const fetchMessages = async () => {
        const { data } = await supabase
          .from('messages')
          .select('id, content, is_from_admin, created_at')
          .eq('sender_id', user.id)
          .order('created_at', { ascending: true });
        
        if (data) {
          setConversationMessages(data);
        }
      };

      fetchAdminProfiles();
      fetchSubmissions();
      fetchMessages();
    }
  }, [user]);

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
      
      // Add to local messages
      setConversationMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        content: message.trim(),
        is_from_admin: false,
        created_at: new Date().toISOString(),
      }]);
      
      toast({ title: 'Message sent!', description: 'Elvis will respond soon.' });
      setMessage('');
    } catch {
      toast({ title: 'Error', description: 'Failed to send message.', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background pt-20 md:pt-8 pb-16">
      <div className="container max-w-2xl">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-8">My Dashboard</h1>
        
        {/* Submission Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl p-6 shadow-sm text-center">
            <CheckCircle className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{submissions.buy}</p>
            <p className="text-muted-foreground text-sm">Buy Requests</p>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-sm text-center">
            <CheckCircle className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{submissions.sell}</p>
            <p className="text-muted-foreground text-sm">Sell Requests</p>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-sm text-center">
            <CheckCircle className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{submissions.work}</p>
            <p className="text-muted-foreground text-sm">Work Apps</p>
          </div>
        </div>

        {/* Admin Contact Card */}
        <div className="bg-card rounded-xl p-6 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-accent" />
            <h2 className="font-serif text-xl font-semibold">Contact Elvis</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            You can message Elvis directly using the form below. Your conversation is private and secure.
          </p>
          
          {adminProfiles.length > 0 ? (
            <div className="space-y-3">
              {adminProfiles.map((admin) => (
                <div key={admin.user_id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{admin.full_name || 'Elvis'}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail size={14} />
                      <span>{admin.email}</span>
                    </div>
                  </div>
                  {admin.email === ADMIN_CONTACT_EMAIL && (
                    <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">Primary Contact</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Loading admin contacts...</p>
            </div>
          )}
        </div>

        {/* Message History */}
        {conversationMessages.length > 0 && (
          <div className="bg-card rounded-xl p-6 shadow-sm mb-8">
            <h3 className="font-serif text-lg font-semibold mb-4">Your Conversation</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {conversationMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.is_from_admin
                      ? 'bg-accent/10 text-foreground ml-8'
                      : 'bg-muted text-foreground mr-8'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {msg.is_from_admin ? 'Elvis' : 'You'} • {new Date(msg.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Form */}
        <div className="bg-card rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-6 h-6 text-accent" />
            <h2 className="font-serif text-xl font-semibold">Send a Message</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Messages are sent directly to <span className="font-medium">{ADMIN_CONTACT_EMAIL}</span>
          </p>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Have a question? Send a message..."
            className="mb-4"
            rows={4}
          />
          <Button 
            variant="accent" 
            onClick={handleSendMessage} 
            disabled={isSending || !message.trim() || !adminUserId}
          >
            <Send size={16} /> {isSending ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuestDashboard;
