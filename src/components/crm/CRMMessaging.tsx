import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, X, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  recipient_id: string | null;
  is_from_admin: boolean;
}

interface Conversation {
  user_id: string;
  user_name: string;
  user_email: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface CRMMessagingProps {
  selectedUserId?: string | null;
  selectedUserName?: string | null;
  onClose?: () => void;
}

const CRMMessaging: React.FC<CRMMessagingProps> = ({ selectedUserId, selectedUserName, onClose }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(selectedUserId || null);
  const [activeUserName, setActiveUserName] = useState<string | null>(selectedUserName || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch all conversations
  useEffect(() => {
    const fetchConversations = async () => {
      const { data: allMessages } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (allMessages) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, email');
        
        const convMap = new Map<string, Conversation>();
        
        allMessages.forEach((msg) => {
          const otherUserId = msg.is_from_admin ? msg.recipient_id : msg.sender_id;
          if (!otherUserId) return;
          
          if (!convMap.has(otherUserId)) {
            const profile = profiles?.find((p) => p.user_id === otherUserId);
            convMap.set(otherUserId, {
              user_id: otherUserId,
              user_name: profile?.full_name || 'Unknown',
              user_email: profile?.email || '',
              last_message: msg.content,
              last_message_at: msg.created_at,
              unread_count: 0,
            });
          }
        });
        
        setConversations(Array.from(convMap.values()));
      }
    };

    fetchConversations();
  }, []);

  // Set active conversation when selectedUserId changes
  useEffect(() => {
    if (selectedUserId) {
      setActiveConversation(selectedUserId);
      setActiveUserName(selectedUserName || null);
    }
  }, [selectedUserId, selectedUserName]);

  // Fetch messages for active conversation
  useEffect(() => {
    if (!activeConversation) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${activeConversation},recipient_id.eq.${activeConversation}`)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    };

    fetchMessages();

    // Set up realtime subscription
    const channel = supabase
      .channel('crm-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id === activeConversation || newMsg.recipient_id === activeConversation) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !user) return;

    setLoading(true);
    const { error } = await supabase.from('messages').insert({
      content: newMessage.trim(),
      sender_id: user.id,
      recipient_id: activeConversation,
      is_from_admin: true,
    });

    if (error) {
      toast.error('Failed to send message');
    } else {
      setNewMessage('');
    }
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[600px] bg-card rounded-xl shadow-sm overflow-hidden">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-border">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Conversations</h3>
        </div>
        <ScrollArea className="h-[calc(100%-57px)]">
          {conversations.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.user_id}
                onClick={() => {
                  setActiveConversation(conv.user_id);
                  setActiveUserName(conv.user_name);
                }}
                className={`p-4 cursor-pointer hover:bg-muted/50 border-b border-border ${
                  activeConversation === conv.user_id ? 'bg-muted' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {conv.user_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{conv.user_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{activeUserName || 'User'}</span>
              </div>
              {onClose && (
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.is_from_admin ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        msg.is_from_admin
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
                <Button onClick={sendMessage} disabled={loading || !newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default CRMMessaging;
