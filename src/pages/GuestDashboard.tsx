import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, CheckCircle } from 'lucide-react';

const GuestDashboard: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [submissions, setSubmissions] = useState({ buy: 0, sell: 0 });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/signin');
    } else if (!isLoading && isAdmin) {
      navigate('/admin');
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      const fetchSubmissions = async () => {
        const [buyRes, sellRes] = await Promise.all([
          supabase.from('buy_requests').select('id').eq('user_id', user.id),
          supabase.from('sell_requests').select('id').eq('user_id', user.id),
        ]);
        setSubmissions({
          buy: buyRes.data?.length || 0,
          sell: sellRes.data?.length || 0,
        });
      };
      fetchSubmissions();
    }
  }, [user]);

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;
    setIsSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        content: message.trim(),
        is_from_admin: false,
      });
      if (error) throw error;
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
        
        <div className="grid grid-cols-2 gap-4 mb-8">
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
        </div>

        <div className="bg-card rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-6 h-6 text-accent" />
            <h2 className="font-serif text-xl font-semibold">Message Elvis</h2>
          </div>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Have a question? Send a message..."
            className="mb-4"
          />
          <Button variant="accent" onClick={handleSendMessage} disabled={isSending || !message.trim()}>
            <Send size={16} /> {isSending ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuestDashboard;
