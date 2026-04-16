import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { ar, fr } from 'date-fns/locale';
import { motion } from 'motion/react';

interface Appointment {
  id: string;
  date: any;
  status: 'pending' | 'accepted' | 'denied';
  notes: string;
}

export default function Appointments() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'appointments'));

    return () => unsubscribe();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-3xl mx-auto py-8"
    >
      <h1 className="text-3xl font-bold tracking-tight">{t('appointments')}</h1>
      {appointments.length === 0 ? (
        <p className="text-neutral-500 text-center py-12">{t('no_appointments')}</p>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt, index) => (
            <motion.div
              key={apt.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border border-neutral-100 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 flex flex-row items-center justify-between bg-neutral-50/50 border-b border-neutral-100">
                  <CardTitle className="text-lg font-semibold">
                    {apt.date?.toDate ? format(apt.date.toDate(), 'PPp', { locale: i18n.language === 'ar' ? ar : fr }) : ''}
                  </CardTitle>
                  <Badge variant="secondary" className={`${getStatusColor(apt.status)} px-3 py-1 rounded-full text-xs font-medium`}>
                    {t(apt.status)}
                  </Badge>
                </CardHeader>
                {apt.notes && (
                  <CardContent className="pt-4">
                    <p className="text-sm text-neutral-600 leading-relaxed">{apt.notes}</p>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
