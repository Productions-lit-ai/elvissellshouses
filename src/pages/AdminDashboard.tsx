import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LayoutDashboard, Users, ShoppingCart, Building2, MessageSquare } from 'lucide-react';

interface BuyRequest { id: string; full_name: string; email: string; phone_number: string; buying_budget: string; preferred_area: string; created_at: string; }
interface SellRequest { id: string; full_name: string; email: string; phone_number: string; home_address: string; created_at: string; }
interface Message { id: string; sender_id: string; content: string; created_at: string; }
interface Profile { id: string; full_name: string; email: string; created_at: string; }

const AdminDashboard: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [buyRequests, setBuyRequests] = useState<BuyRequest[]>([]);
  const [sellRequests, setSellRequests] = useState<SellRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate('/signin');
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      supabase.from('buy_requests').select('*').order('created_at', { ascending: false }).then(({ data }) => setBuyRequests(data || []));
      supabase.from('sell_requests').select('*').order('created_at', { ascending: false }).then(({ data }) => setSellRequests(data || []));
      supabase.from('messages').select('*').order('created_at', { ascending: false }).then(({ data }) => setMessages(data || []));
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => setProfiles(data || []));
    }
  }, [isAdmin]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background pt-20 md:pt-8 pb-16">
      <div className="container">
        <div className="flex items-center gap-3 mb-8">
          <LayoutDashboard className="w-8 h-8 text-accent" />
          <h1 className="font-serif text-3xl font-bold text-foreground">Admin CRM</h1>
        </div>

        <Tabs defaultValue="buy" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="buy"><ShoppingCart size={16} className="mr-1" /> Buy</TabsTrigger>
            <TabsTrigger value="sell"><Building2 size={16} className="mr-1" /> Sell</TabsTrigger>
            <TabsTrigger value="users"><Users size={16} className="mr-1" /> Users</TabsTrigger>
            <TabsTrigger value="messages"><MessageSquare size={16} className="mr-1" /> Msgs</TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="bg-card rounded-xl p-4 shadow-sm overflow-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Budget</TableHead><TableHead>Area</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {buyRequests.map((r) => (
                  <TableRow key={r.id}><TableCell>{r.full_name}</TableCell><TableCell>{r.email}</TableCell><TableCell>{r.phone_number}</TableCell><TableCell>{r.buying_budget}</TableCell><TableCell>{r.preferred_area}</TableCell><TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell></TableRow>
                ))}
                {buyRequests.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No buy requests yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="sell" className="bg-card rounded-xl p-4 shadow-sm overflow-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Address</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {sellRequests.map((r) => (
                  <TableRow key={r.id}><TableCell>{r.full_name}</TableCell><TableCell>{r.email}</TableCell><TableCell>{r.phone_number}</TableCell><TableCell>{r.home_address}</TableCell><TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell></TableRow>
                ))}
                {sellRequests.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No sell requests yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="users" className="bg-card rounded-xl p-4 shadow-sm overflow-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Joined</TableHead></TableRow></TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id}><TableCell>{p.full_name || 'N/A'}</TableCell><TableCell>{p.email}</TableCell><TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="messages" className="bg-card rounded-xl p-4 shadow-sm overflow-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Message</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {messages.map((m) => (
                  <TableRow key={m.id}><TableCell>{m.content}</TableCell><TableCell>{new Date(m.created_at).toLocaleDateString()}</TableCell></TableRow>
                ))}
                {messages.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No messages yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
