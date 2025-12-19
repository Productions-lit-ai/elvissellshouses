import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, Users, ShoppingCart, Building2, MessageSquare, Briefcase, Search, Filter, ArrowUpDown } from 'lucide-react';

interface BuyRequest { id: string; full_name: string; email: string; phone_number: string; buying_budget: string; preferred_area: string; created_at: string; user_id: string; }
interface SellRequest { id: string; full_name: string; email: string; phone_number: string; home_address: string; created_at: string; user_id: string; }
interface WorkRequest { id: string; full_name: string; email: string; location: string; age: string; skill: string; skill_level: string; created_at: string; user_id: string | null; }
interface Message { id: string; sender_id: string; recipient_id: string | null; content: string; created_at: string; is_from_admin: boolean; sender_email?: string; }
interface Profile { id: string; user_id: string; full_name: string; email: string; created_at: string; }

type FormType = 'all' | 'buy' | 'sell' | 'work';
type SortField = 'name' | 'date' | 'location' | 'age';
type SortOrder = 'asc' | 'desc';

const AdminDashboard: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [buyRequests, setBuyRequests] = useState<BuyRequest[]>([]);
  const [sellRequests, setSellRequests] = useState<SellRequest[]>([]);
  const [workRequests, setWorkRequests] = useState<WorkRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [formTypeFilter, setFormTypeFilter] = useState<FormType>('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate('/signin');
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      supabase.from('buy_requests').select('*').order('created_at', { ascending: false }).then(({ data }) => setBuyRequests(data || []));
      supabase.from('sell_requests').select('*').order('created_at', { ascending: false }).then(({ data }) => setSellRequests(data || []));
      supabase.from('work_with_me_requests').select('*').order('created_at', { ascending: false }).then(({ data }) => setWorkRequests(data || []));
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => setProfiles(data || []));
      
      // Fetch messages with sender info
      supabase.from('messages').select('*').order('created_at', { ascending: false }).then(async ({ data }) => {
        if (data) {
          const messagesWithEmail = await Promise.all(
            data.map(async (msg) => {
              const profile = profiles.find(p => p.user_id === msg.sender_id);
              if (profile) {
                return { ...msg, sender_email: profile.email };
              }
              const { data: profileData } = await supabase.from('profiles').select('email').eq('user_id', msg.sender_id).single();
              return { ...msg, sender_email: profileData?.email || 'Unknown' };
            })
          );
          setMessages(messagesWithEmail);
        }
      });
    }
  }, [isAdmin, profiles.length]);

  // Combined submissions for filtering
  const allSubmissions = useMemo(() => {
    const combined: Array<{
      id: string;
      type: 'buy' | 'sell' | 'work';
      full_name: string;
      email: string;
      location: string;
      age: string;
      created_at: string;
      details: string;
    }> = [];

    buyRequests.forEach(r => combined.push({
      id: r.id,
      type: 'buy',
      full_name: r.full_name,
      email: r.email,
      location: r.preferred_area,
      age: '',
      created_at: r.created_at,
      details: `Budget: ${r.buying_budget}`,
    }));

    sellRequests.forEach(r => combined.push({
      id: r.id,
      type: 'sell',
      full_name: r.full_name,
      email: r.email,
      location: r.home_address,
      age: '',
      created_at: r.created_at,
      details: `Address: ${r.home_address}`,
    }));

    workRequests.forEach(r => combined.push({
      id: r.id,
      type: 'work',
      full_name: r.full_name,
      email: r.email,
      location: r.location,
      age: r.age,
      created_at: r.created_at,
      details: `${r.skill} (${r.skill_level})`,
    }));

    return combined;
  }, [buyRequests, sellRequests, workRequests]);

  // Filtered and sorted submissions
  const filteredSubmissions = useMemo(() => {
    let result = allSubmissions;

    // Filter by form type
    if (formTypeFilter !== 'all') {
      result = result.filter(s => s.type === formTypeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.full_name.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term) ||
        s.location.toLowerCase().includes(term)
      );
    }

    // Filter by location
    if (locationFilter) {
      const loc = locationFilter.toLowerCase();
      result = result.filter(s => s.location.toLowerCase().includes(loc));
    }

    // Filter by age
    if (ageFilter) {
      result = result.filter(s => s.age === ageFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.full_name.localeCompare(b.full_name);
          break;
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'location':
          comparison = a.location.localeCompare(b.location);
          break;
        case 'age':
          comparison = (parseInt(a.age) || 0) - (parseInt(b.age) || 0);
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [allSubmissions, formTypeFilter, searchTerm, locationFilter, ageFilter, sortField, sortOrder]);

  const getTypeBadge = (type: 'buy' | 'sell' | 'work') => {
    const variants: Record<string, { label: string; className: string }> = {
      buy: { label: 'Buying', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
      sell: { label: 'Selling', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      work: { label: 'Work With Me', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    };
    return <Badge className={variants[type].className}>{variants[type].label}</Badge>;
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background pt-20 md:pt-8 pb-16">
      <div className="container">
        <div className="flex items-center gap-3 mb-8">
          <LayoutDashboard className="w-8 h-8 text-accent" />
          <h1 className="font-serif text-3xl font-bold text-foreground">Admin CRM</h1>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="all"><Filter size={16} className="mr-1" /> All</TabsTrigger>
            <TabsTrigger value="buy"><ShoppingCart size={16} className="mr-1" /> Buy</TabsTrigger>
            <TabsTrigger value="sell"><Building2 size={16} className="mr-1" /> Sell</TabsTrigger>
            <TabsTrigger value="work"><Briefcase size={16} className="mr-1" /> Work</TabsTrigger>
            <TabsTrigger value="messages"><MessageSquare size={16} className="mr-1" /> Msgs</TabsTrigger>
          </TabsList>

          {/* All Submissions Tab with Filtering */}
          <TabsContent value="all" className="space-y-4">
            {/* Filters */}
            <div className="bg-card rounded-xl p-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={formTypeFilter} onValueChange={(v) => setFormTypeFilter(v as FormType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Form Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Forms</SelectItem>
                    <SelectItem value="buy">Buying a House</SelectItem>
                    <SelectItem value="sell">Selling a House</SelectItem>
                    <SelectItem value="work">Work With Me</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Filter by location"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />

                <Input
                  placeholder="Filter by age"
                  value={ageFilter}
                  onChange={(e) => setAgeFilter(e.target.value)}
                />

                <Select value={`${sortField}-${sortOrder}`} onValueChange={(v) => {
                  const [field, order] = v.split('-');
                  setSortField(field as SortField);
                  setSortOrder(order as SortOrder);
                }}>
                  <SelectTrigger>
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Newest First</SelectItem>
                    <SelectItem value="date-asc">Oldest First</SelectItem>
                    <SelectItem value="name-asc">Name A-Z</SelectItem>
                    <SelectItem value="name-desc">Name Z-A</SelectItem>
                    <SelectItem value="location-asc">Location A-Z</SelectItem>
                    <SelectItem value="age-asc">Age (Low-High)</SelectItem>
                    <SelectItem value="age-desc">Age (High-Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-card rounded-xl p-4 shadow-sm overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((s) => (
                    <TableRow key={`${s.type}-${s.id}`}>
                      <TableCell>{getTypeBadge(s.type)}</TableCell>
                      <TableCell className="font-medium">{s.full_name}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell>{s.location || '-'}</TableCell>
                      <TableCell>{s.age || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{s.details}</TableCell>
                      <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {filteredSubmissions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No submissions match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

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

          <TabsContent value="work" className="bg-card rounded-xl p-4 shadow-sm overflow-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Location</TableHead><TableHead>Age</TableHead><TableHead>Skill</TableHead><TableHead>Level</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {workRequests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.full_name}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.location}</TableCell>
                    <TableCell>{r.age}</TableCell>
                    <TableCell>{r.skill}</TableCell>
                    <TableCell><Badge variant="outline">{r.skill_level}</Badge></TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {workRequests.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No work applications yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="messages" className="bg-card rounded-xl p-4 shadow-sm overflow-auto">
            <Table>
              <TableHeader><TableRow><TableHead>From</TableHead><TableHead>Message</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {messages.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.sender_email || 'Unknown'}</TableCell>
                    <TableCell className="max-w-md truncate">{m.content}</TableCell>
                    <TableCell>{new Date(m.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {messages.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No messages yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
