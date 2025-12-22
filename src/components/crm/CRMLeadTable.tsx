import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, ArrowUpDown, Eye, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Lead {
  id: string;
  type: 'buy' | 'sell' | 'work';
  full_name: string;
  email: string;
  phone_number: string;
  location: string;
  age?: string;
  details: string;
  created_at: string;
  lead_status: string;
  user_id: string | null;
}

interface CRMLeadTableProps {
  leads: Lead[];
  onStatusChange: (id: string, type: string, status: string) => void;
  onOpenChat: (lead: Lead) => void;
}

type SortField = 'full_name' | 'email' | 'created_at' | 'location' | 'lead_status';
type SortOrder = 'asc' | 'desc';

const statusColors: Record<string, string> = {
  new: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  contacted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  'in progress': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  closed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
};

const typeColors: Record<string, string> = {
  buy: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  sell: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  work: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
};

const CRMLeadTable: React.FC<CRMLeadTableProps> = ({ leads, onStatusChange, onOpenChat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredLeads = leads
    .filter((lead) => {
      const matchesSearch =
        lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.phone_number && lead.phone_number.includes(searchTerm));
      const matchesType = typeFilter === 'all' || lead.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || lead.lead_status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'full_name') comparison = a.full_name.localeCompare(b.full_name);
      else if (sortField === 'email') comparison = a.email.localeCompare(b.email);
      else if (sortField === 'location') comparison = (a.location || '').localeCompare(b.location || '');
      else if (sortField === 'lead_status') comparison = a.lead_status.localeCompare(b.lead_status);
      else comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const totalPages = Math.ceil(filteredLeads.length / pageSize);
  const paginatedLeads = filteredLeads.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleStatusUpdate = async (lead: Lead, newStatus: string) => {
    let error = null;
    
    if (lead.type === 'buy') {
      const result = await supabase.from('buy_requests').update({ lead_status: newStatus }).eq('id', lead.id);
      error = result.error;
    } else if (lead.type === 'sell') {
      const result = await supabase.from('sell_requests').update({ lead_status: newStatus }).eq('id', lead.id);
      error = result.error;
    } else {
      const result = await supabase.from('work_with_me_requests').update({ lead_status: newStatus }).eq('id', lead.id);
      error = result.error;
    }
    
    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Lead status updated');
      onStatusChange(lead.id, lead.type, newStatus);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Form Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="buy">Buyer</SelectItem>
            <SelectItem value="sell">Seller</SelectItem>
            <SelectItem value="work">Work With Me</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="in progress">In Progress</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="cursor-pointer" onClick={() => handleSort('full_name')}>
                  <div className="flex items-center gap-1">
                    Name <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('email')}>
                  <div className="flex items-center gap-1">
                    Email <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('location')}>
                  <div className="flex items-center gap-1">
                    Location <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('lead_status')}>
                  <div className="flex items-center gap-1">
                    Status <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>
                  <div className="flex items-center gap-1">
                    Date <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeads.map((lead) => (
                <TableRow key={`${lead.type}-${lead.id}`} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{lead.full_name}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.phone_number || '-'}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{lead.location || '-'}</TableCell>
                  <TableCell>
                    <Badge className={typeColors[lead.type]} variant="secondary">
                      {lead.type === 'buy' ? 'Buyer' : lead.type === 'sell' ? 'Seller' : 'Work'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={lead.lead_status}
                      onValueChange={(value) => handleStatusUpdate(lead, value)}
                    >
                      <SelectTrigger className={`w-[120px] h-8 text-xs ${statusColors[lead.lead_status]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="in progress">In Progress</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {lead.user_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onOpenChat(lead)}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No leads found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredLeads.length)} of{' '}
              {filteredLeads.length} leads
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{selectedLead.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedLead.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedLead.phone_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedLead.location || 'N/A'}</p>
                </div>
                {selectedLead.age && (
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">{selectedLead.age}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Form Type</p>
                  <Badge className={typeColors[selectedLead.type]}>
                    {selectedLead.type === 'buy' ? 'Buyer' : selectedLead.type === 'sell' ? 'Seller' : 'Work With Me'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedLead.lead_status]}>{selectedLead.lead_status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="font-medium">{new Date(selectedLead.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Details</p>
                <p className="font-medium">{selectedLead.details}</p>
              </div>
              {selectedLead.user_id && (
                <Button onClick={() => { setSelectedLead(null); onOpenChat(selectedLead); }} className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" /> Open Chat
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRMLeadTable;
