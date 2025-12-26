import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Search, ArrowUpDown, Eye, MessageSquare, ChevronLeft, ChevronRight, CalendarIcon, StickyNote, Send, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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

interface LeadNote {
  id: string;
  lead_id: string;
  lead_type: string;
  note: string;
  created_by: string;
  created_at: string;
}

interface CRMLeadTableProps {
  leads: Lead[];
  onStatusChange: (id: string, type: string, status: string) => void;
  onOpenChat: (lead: Lead) => void;
}

type SortField = 'full_name' | 'email' | 'created_at' | 'location' | 'lead_status';
type SortOrder = 'asc' | 'desc';

const statusColors: Record<string, string> = {
  new: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200',
  contacted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200',
  'in progress': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200',
  closed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200',
};

const typeColors: Record<string, string> = {
  buy: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  sell: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  work: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
};

const typeLabels: Record<string, string> = {
  buy: 'Buying a House',
  sell: 'Selling a House',
  work: 'Work With Me',
};

const CRMLeadTable: React.FC<CRMLeadTableProps> = ({ leads, onStatusChange, onOpenChat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const pageSize = 10;

  // Fetch notes when a lead is selected
  useEffect(() => {
    if (selectedLead) {
      fetchNotes(selectedLead.id, selectedLead.type);
    }
  }, [selectedLead]);

  const fetchNotes = async (leadId: string, leadType: string) => {
    setIsLoadingNotes(true);
    const { data, error } = await supabase
      .from('lead_notes')
      .select('*')
      .eq('lead_id', leadId)
      .eq('lead_type', leadType)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setNotes(data);
    }
    setIsLoadingNotes(false);
  };

  const handleAddNote = async () => {
    if (!selectedLead || !newNote.trim()) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase.from('lead_notes').insert({
      lead_id: selectedLead.id,
      lead_type: selectedLead.type,
      note: newNote.trim(),
      created_by: userData.user.id,
    });

    if (error) {
      toast.error('Failed to add note');
    } else {
      toast.success('Note added');
      setNewNote('');
      fetchNotes(selectedLead.id, selectedLead.type);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const { error } = await supabase.from('lead_notes').delete().eq('id', noteId);
    if (error) {
      toast.error('Failed to delete note');
    } else {
      setNotes(notes.filter(n => n.id !== noteId));
      toast.success('Note deleted');
    }
  };

  const filteredLeads = leads
    .filter((lead) => {
      const matchesSearch =
        lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.phone_number && lead.phone_number.includes(searchTerm));
      const matchesType = typeFilter === 'all' || lead.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || lead.lead_status === statusFilter;
      
      // Date range filter
      const leadDate = new Date(lead.created_at);
      const matchesDateFrom = !dateFrom || leadDate >= dateFrom;
      const matchesDateTo = !dateTo || leadDate <= new Date(dateTo.setHours(23, 59, 59, 999));
      
      return matchesSearch && matchesType && matchesStatus && matchesDateFrom && matchesDateTo;
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

  const clearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <div className="space-y-4">
      {/* Filters - Zoho-style filter bar */}
      <div className="bg-card rounded-xl p-4 shadow-sm border border-border/50">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-background"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-10 bg-background">
              <SelectValue placeholder="Form Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Form Types</SelectItem>
              <SelectItem value="buy">Buying a House</SelectItem>
              <SelectItem value="sell">Selling a House</SelectItem>
              <SelectItem value="work">Work With Me</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-10 bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">In-Review</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
              <SelectItem value="closed">Completed</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[140px] h-10 justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="pointer-events-auto" />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[140px] h-10 justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "MMM d, yyyy") : "To Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="pointer-events-auto" />
            </PopoverContent>
          </Popover>

          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={clearDateFilters} className="h-10 text-muted-foreground hover:text-foreground">
              Clear Dates
            </Button>
          )}
        </div>
      </div>

      {/* Table - Enhanced Zoho-style */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="cursor-pointer font-semibold" onClick={() => handleSort('full_name')}>
                  <div className="flex items-center gap-2">
                    Applicant Name <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer font-semibold" onClick={() => handleSort('email')}>
                  <div className="flex items-center gap-2">
                    Email <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold">Phone</TableHead>
                <TableHead className="cursor-pointer font-semibold" onClick={() => handleSort('location')}>
                  <div className="flex items-center gap-2">
                    Address/Location <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold">Type of Form</TableHead>
                <TableHead className="cursor-pointer font-semibold" onClick={() => handleSort('created_at')}>
                  <div className="flex items-center gap-2">
                    Date Submitted <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer font-semibold" onClick={() => handleSort('lead_status')}>
                  <div className="flex items-center gap-2">
                    Status <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeads.map((lead) => (
                <TableRow 
                  key={`${lead.type}-${lead.id}`} 
                  className="hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => setSelectedLead(lead)}
                >
                  <TableCell className="font-medium text-foreground">{lead.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.phone_number || '-'}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-muted-foreground">{lead.location || '-'}</TableCell>
                  <TableCell>
                    <Badge className={cn(typeColors[lead.type], "font-medium")} variant="secondary">
                      {typeLabels[lead.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={lead.lead_status}
                      onValueChange={(value) => handleStatusUpdate(lead, value)}
                    >
                      <SelectTrigger className={cn("w-[130px] h-8 text-xs border", statusColors[lead.lead_status])}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">In-Review</SelectItem>
                        <SelectItem value="in progress">In Progress</SelectItem>
                        <SelectItem value="closed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {lead.user_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
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
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-muted-foreground/50" />
                      <p>No applications found matching your criteria.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination - Enhanced */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium text-foreground">{Math.min(page * pageSize, filteredLeads.length)}</span> of{' '}
              <span className="font-medium text-foreground">{filteredLeads.length}</span> applications
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Lead Detail Dialog - Enhanced with Notes */}
      <Dialog open={!!selectedLead} onOpenChange={() => { setSelectedLead(null); setNotes([]); setNewNote(''); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {selectedLead?.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-xl">{selectedLead?.full_name}</span>
                <Badge className={cn(typeColors[selectedLead?.type || 'buy'], "ml-3 text-xs")}>
                  {selectedLead && typeLabels[selectedLead.type]}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedLead && (
            <div className="space-y-6 mt-4">
              {/* Contact Info Card */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedLead.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedLead.phone_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Address/Location</p>
                    <p className="font-medium">{selectedLead.location || 'N/A'}</p>
                  </div>
                  {selectedLead.age && (
                    <div>
                      <p className="text-xs text-muted-foreground">Age</p>
                      <p className="font-medium">{selectedLead.age}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Application Details Card */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Application Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Select
                      value={selectedLead.lead_status}
                      onValueChange={(value) => {
                        handleStatusUpdate(selectedLead, value);
                        setSelectedLead({ ...selectedLead, lead_status: value });
                      }}
                    >
                      <SelectTrigger className={cn("w-[140px] h-8 mt-1 text-xs border", statusColors[selectedLead.lead_status])}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">In-Review</SelectItem>
                        <SelectItem value="in progress">In Progress</SelectItem>
                        <SelectItem value="closed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p className="font-medium">{new Date(selectedLead.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Additional Details</p>
                  <p className="font-medium">{selectedLead.details}</p>
                </div>
              </div>

              {/* Internal Notes Section */}
              <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-lg p-4 space-y-3 border border-amber-200/50 dark:border-amber-800/30">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-amber-600" />
                  <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-400 uppercase tracking-wide">
                    Internal Notes
                  </h4>
                </div>

                {/* Add Note Input */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add an internal note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[60px] bg-background resize-none"
                  />
                  <Button onClick={handleAddNote} disabled={!newNote.trim()} size="icon" className="h-[60px] w-12">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {/* Notes List */}
                {isLoadingNotes ? (
                  <p className="text-sm text-muted-foreground">Loading notes...</p>
                ) : notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No notes yet. Add one above.</p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {notes.map((note) => (
                      <div key={note.id} className="bg-background rounded-md p-3 flex justify-between items-start group">
                        <div className="flex-1">
                          <p className="text-sm">{note.note}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(note.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button */}
              {selectedLead.user_id && (
                <Button 
                  onClick={() => { setSelectedLead(null); onOpenChat(selectedLead); }} 
                  className="w-full"
                  size="lg"
                >
                  <MessageSquare className="w-4 h-4 mr-2" /> Open Chat with {selectedLead.full_name}
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