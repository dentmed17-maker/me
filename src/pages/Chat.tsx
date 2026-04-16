import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Send } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: any;
  read: boolean;
}

export default function Chat() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    
    // In a real app, you'd want a more complex query to get messages between this user and the admin.
    // For simplicity, we'll query where senderId == user.uid OR receiverId == user.uid
    // Firestore requires a composite index for OR queries with orderBy, so we'll fetch all related to user and sort client-side.
    
    const q1 = query(collection(db, 'messages'), where('senderId', '==', user.uid));
    const q2 = query(collection(db, 'messages'), where('receiverId', '==', user.uid));
    
    const unsub1 = onSnapshot(q1, (snapshot) => {
      const msgs1 = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(prev => {
        const combined = [...prev.filter(m => m.senderId !== user.uid), ...msgs1];
        return combined.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
      });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'messages'));

    const unsub2 = onSnapshot(q2, (snapshot) => {
      const msgs2 = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(prev => {
        const combined = [...prev.filter(m => m.receiverId !== user.uid), ...msgs2];
        return combined.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
      });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'messages'));

    return () => { unsub1(); unsub2(); };
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: user.uid,
        receiverId: 'admin', // Assuming a generic 'admin' receiver for the secretary
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        read: false
      });
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-card rounded-2xl shadow-none border border-border overflow-hidden">
      <div className="p-6 border-b border-border bg-background/50 flex items-center justify-between">
        <div>
          <span className="text-[11px] uppercase text-muted-foreground tracking-widest">{t('chat')}</span>
          <h2 className="font-serif text-2xl tracking-tight mt-1">{t('contact_secretary')}</h2>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="space-y-6">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground font-serif py-12">{t('no_messages')}</p>
          ) : (
            messages.map(msg => {
              const isMine = msg.senderId === user?.uid;
              return (
                <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-5 py-3 ${isMine ? 'bg-primary text-primary-foreground' : 'bg-background border border-border text-foreground'}`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-2 px-2 uppercase tracking-wider">
                    {msg.timestamp?.toDate ? format(msg.timestamp.toDate(), 'HH:mm') : ''}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-3 bg-background/50">
        <Input 
          value={newMessage} 
          onChange={e => setNewMessage(e.target.value)} 
          placeholder={t('type_message')}
          className="rounded-md bg-card border-border h-12"
        />
        <Button type="submit" size="icon" className="rounded-md shrink-0 h-12 w-12 bg-primary text-primary-foreground" disabled={!newMessage.trim()}>
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
}
