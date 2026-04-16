import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { ar, fr } from 'date-fns/locale';
import { Navigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

export default function Admin() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuthStore();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [showcases, setShowcases] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  
  // Showcase form
  const [isAddingShowcase, setIsAddingShowcase] = useState(false);
  const [newShowcase, setNewShowcase] = useState({ titleAr: '', titleFr: '', descAr: '', descFr: '', imageUrl: '' });

  // Chat state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (profile?.role !== 'admin') return;

    const unsubApts = onSnapshot(query(collection(db, 'appointments'), orderBy('date', 'desc')), (snapshot) => {
      setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'appointments'));

    const unsubShows = onSnapshot(query(collection(db, 'showcases'), orderBy('createdAt', 'desc')), (snapshot) => {
      setShowcases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'showcases'));

    const unsubMsgs = onSnapshot(query(collection(db, 'messages'), orderBy('timestamp', 'asc')), (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'messages'));

    return () => { unsubApts(); unsubShows(); unsubMsgs(); };
  }, [profile]);

  if (profile?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  const handleUpdateAppointment = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'appointments', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${id}`);
    }
  };

  const handleAddShowcase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'showcases'), {
        ...newShowcase,
        createdAt: serverTimestamp()
      });
      setIsAddingShowcase(false);
      setNewShowcase({ titleAr: '', titleFr: '', descAr: '', descFr: '', imageUrl: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'showcases');
    }
  };

  const handleDeleteShowcase = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'showcases', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `showcases/${id}`);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !replyText.trim()) return;
    try {
      await addDoc(collection(db, 'messages'), {
        senderId: 'admin',
        receiverId: selectedUserId,
        text: replyText.trim(),
        timestamp: serverTimestamp(),
        read: false
      });
      setReplyText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    }
  };

  // Group messages by user
  const chatUsers = Array.from(new Set(messages.map(m => m.senderId === 'admin' ? m.receiverId : m.senderId))) as string[];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end border-b border-border pb-4">
        <div>
          <span className="text-[11px] uppercase text-muted-foreground tracking-widest">{t('admin')}</span>
          <h1 className="text-3xl font-serif font-normal tracking-tight">Tableau de Bord</h1>
        </div>
      </div>
      
      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card border border-border rounded-md p-1">
          <TabsTrigger value="appointments" className="rounded-sm text-xs uppercase tracking-wider data-[state=active]:bg-background">{t('appointments')}</TabsTrigger>
          <TabsTrigger value="chat" className="rounded-sm text-xs uppercase tracking-wider data-[state=active]:bg-background">{t('chat')}</TabsTrigger>
          <TabsTrigger value="showcases" className="rounded-sm text-xs uppercase tracking-wider data-[state=active]:bg-background">{t('services')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="appointments" className="space-y-4 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="border border-border p-4 rounded-xl bg-card">
               <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Attente / في الانتظار</div>
               <div className="text-2xl font-serif mt-1">{appointments.filter(a => a.status === 'pending').length}</div>
            </div>
            <div className="border border-border p-4 rounded-xl bg-card">
               <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Acceptés / مقبول</div>
               <div className="text-2xl font-serif mt-1">{appointments.filter(a => a.status === 'accepted').length}</div>
            </div>
            <div className="border border-border p-4 rounded-xl bg-card">
               <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Total</div>
               <div className="text-2xl font-serif mt-1">{appointments.length}</div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-[11px] uppercase text-muted-foreground font-normal tracking-wider">Patient</th>
                  <th className="p-4 text-[11px] uppercase text-muted-foreground font-normal tracking-wider">Date</th>
                  <th className="p-4 text-[11px] uppercase text-muted-foreground font-normal tracking-wider">Statut</th>
                  <th className="p-4 text-[11px] uppercase text-muted-foreground font-normal tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(apt => (
                  <tr key={apt.id} className="border-b border-border/50 last:border-0 hover:bg-background/50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-sm">{apt.userName}</div>
                      {apt.notes && <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{apt.notes}</div>}
                    </td>
                    <td className="p-4 text-sm">
                      {apt.date?.toDate ? format(apt.date.toDate(), 'PPp', { locale: i18n.language === 'ar' ? ar : fr }) : ''}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${apt.status === 'pending' ? 'bg-[#FFF4E5] text-[#B7791F]' : apt.status === 'accepted' ? 'bg-[#E6FFFA] text-[#2C7A7B]' : 'bg-red-100 text-red-800'}`}>
                        {t(apt.status)}
                      </span>
                    </td>
                    <td className="p-4">
                      {apt.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleUpdateAppointment(apt.id, 'accepted')} className="h-8 text-[11px] px-3 bg-primary text-primary-foreground rounded-md">{t('accept')}</Button>
                          <Button size="sm" variant="outline" onClick={() => handleUpdateAppointment(apt.id, 'denied')} className="h-8 text-[11px] px-3 rounded-md">{t('deny')}</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
            <Card className="col-span-1 border border-border shadow-none rounded-2xl overflow-hidden flex flex-col bg-card">
              <div className="p-4 border-b border-border bg-background/50 font-serif text-lg">Users</div>
              <div className="flex-1 overflow-y-auto">
                {chatUsers.filter(id => id !== 'admin').map(userId => (
                  <button 
                    key={userId}
                    onClick={() => setSelectedUserId(userId)}
                    className={`w-full text-left p-4 border-b border-border hover:bg-background transition-colors ${selectedUserId === userId ? 'bg-background border-primary/20' : ''}`}
                  >
                    <span className="text-sm font-medium truncate block">User: {userId.substring(0, 8)}...</span>
                  </button>
                ))}
              </div>
            </Card>
            
            <Card className="col-span-1 md:col-span-2 border border-border shadow-none rounded-2xl overflow-hidden flex flex-col bg-card">
              {selectedUserId ? (
                <>
                  <div className="p-4 border-b border-border bg-background/50 font-serif text-lg">Chat with {selectedUserId.substring(0, 8)}...</div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.filter(m => (m.senderId === selectedUserId && m.receiverId === 'admin') || (m.senderId === 'admin' && m.receiverId === selectedUserId)).map(msg => {
                      const isAdmin = msg.senderId === 'admin';
                      return (
                        <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[80%] rounded-xl px-4 py-2 ${isAdmin ? 'bg-primary text-primary-foreground' : 'bg-background border border-border text-foreground'}`}>
                            <p className="text-sm">{msg.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <form onSubmit={handleSendReply} className="p-4 border-t border-border flex gap-3 bg-background/50">
                    <Input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={t('type_message')} className="rounded-md bg-card border-border" />
                    <Button type="submit" size="sm" className="rounded-md px-6 bg-primary text-primary-foreground">{t('send')}</Button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground font-serif">Select a user to chat</div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="showcases" className="space-y-6 mt-8">
          <div className="flex justify-end">
            <Dialog open={isAddingShowcase} onOpenChange={setIsAddingShowcase}>
              <DialogTrigger render={<Button className="rounded-md bg-primary text-primary-foreground text-xs uppercase tracking-wider" />}>
                {t('add_showcase')}
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-2xl bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-serif font-normal text-2xl">{t('add_showcase')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddShowcase} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Title (Arabic)</Label>
                    <Input value={newShowcase.titleAr} onChange={e => setNewShowcase({...newShowcase, titleAr: e.target.value})} required className="rounded-md bg-background border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Title (French)</Label>
                    <Input value={newShowcase.titleFr} onChange={e => setNewShowcase({...newShowcase, titleFr: e.target.value})} required className="rounded-md bg-background border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Description (Arabic)</Label>
                    <Textarea value={newShowcase.descAr} onChange={e => setNewShowcase({...newShowcase, descAr: e.target.value})} required className="rounded-md bg-background border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Description (French)</Label>
                    <Textarea value={newShowcase.descFr} onChange={e => setNewShowcase({...newShowcase, descFr: e.target.value})} required className="rounded-md bg-background border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Image URL</Label>
                    <Input value={newShowcase.imageUrl} onChange={e => setNewShowcase({...newShowcase, imageUrl: e.target.value})} required className="rounded-md bg-background border-border" />
                  </div>
                  <Button type="submit" className="w-full rounded-md bg-primary text-primary-foreground text-sm uppercase tracking-wider">{t('save')}</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {showcases.map(showcase => (
              <Card key={showcase.id} className="overflow-hidden rounded-2xl border border-border shadow-none bg-card">
                <div className="aspect-video w-full overflow-hidden bg-background">
                  <img src={showcase.imageUrl} alt={showcase.titleAr} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <CardHeader className="p-4">
                  <CardTitle className="font-serif text-lg">{showcase.titleAr} / {showcase.titleFr}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Button variant="outline" size="sm" onClick={() => handleDeleteShowcase(showcase.id)} className="w-full rounded-md text-xs uppercase tracking-wider text-destructive border-destructive/20 hover:bg-destructive/10">Delete</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
