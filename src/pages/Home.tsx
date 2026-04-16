import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { motion } from 'motion/react';

interface Showcase {
  id: string;
  titleAr: string;
  titleFr: string;
  descAr: string;
  descFr: string;
  imageUrl: string;
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const { user, profile } = useAuthStore();
  const [showcases, setShowcases] = useState<Showcase[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'showcases'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Showcase));
      setShowcases(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'showcases'));

    return () => unsubscribe();
  }, []);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    try {
      await addDoc(collection(db, 'appointments'), {
        userId: user.uid,
        userName: profile.displayName,
        date: new Date(date),
        status: 'pending',
        notes,
        createdAt: serverTimestamp()
      });
      setIsBooking(false);
      setDate('');
      setNotes('');
      alert('Appointment requested successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'appointments');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-16"
    >
      <section className="text-center space-y-8 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-4"
        >
          {i18n.language === 'ar' ? 'مرحبا' : 'Bienvenue'}
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-5xl md:text-7xl font-serif font-normal tracking-tight text-foreground"
        >
          {t('app_name')}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          {i18n.language === 'ar' 
            ? 'نقدم لك أفضل خدمات العناية بالأسنان بأحدث التقنيات وبأعلى معايير الجودة.' 
            : 'Nous vous offrons les meilleurs soins dentaires avec les dernières technologies et les plus hauts standards de qualité.'}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {user ? (
            <Dialog open={isBooking} onOpenChange={setIsBooking}>
              <DialogTrigger render={<Button size="lg" className="rounded-md px-8 h-14 text-sm font-semibold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-all" />}>
                {t('book_appointment')}
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-2xl bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-serif font-normal">{t('book_appointment')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleBookAppointment} className="space-y-5 mt-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t('date')}</Label>
                    <Input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required className="h-12 rounded-md bg-background border-border focus:bg-white transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">{t('notes')}</Label>
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="rounded-md bg-background border-border focus:bg-white transition-colors resize-none" />
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-md text-sm font-semibold uppercase tracking-wider bg-primary text-primary-foreground">{t('send')}</Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <p className="text-sm text-muted-foreground mt-4 uppercase tracking-wider">{t('login')} {t('book_appointment').toLowerCase()}</p>
          )}
        </motion.div>
      </section>

      <section className="space-y-8">
        <h2 className="text-2xl font-serif font-normal tracking-tight text-center">{t('services')}</h2>
        {showcases.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">{t('no_services')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {showcases.map((showcase, index) => (
              <motion.div
                key={showcase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="overflow-hidden border border-border shadow-none bg-card rounded-2xl h-full flex flex-col group">
                  <div className="aspect-[4/3] w-full overflow-hidden bg-background">
                    <img src={showcase.imageUrl} alt={showcase.titleAr} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  </div>
                  <CardHeader className="flex-1 p-6">
                    <CardTitle className="text-lg font-serif font-normal">{i18n.language === 'ar' ? showcase.titleAr : showcase.titleFr}</CardTitle>
                    <CardDescription className="line-clamp-3 text-sm leading-relaxed mt-2 text-muted-foreground">
                      {i18n.language === 'ar' ? showcase.descAr : showcase.descFr}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}
