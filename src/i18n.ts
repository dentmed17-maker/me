import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  ar: {
    translation: {
      "app_name": "عيادة طب الأسنان",
      "home": "الرئيسية",
      "appointments": "المواعيد",
      "chat": "المحادثة",
      "admin": "لوحة الإدارة",
      "login": "تسجيل الدخول",
      "logout": "تسجيل الخروج",
      "book_appointment": "احجز موعداً",
      "services": "خدماتنا",
      "contact_secretary": "تواصل مع السكرتير",
      "date": "التاريخ",
      "notes": "ملاحظات",
      "status": "الحالة",
      "pending": "قيد الانتظار",
      "accepted": "مقبول",
      "denied": "مرفوض",
      "send": "إرسال",
      "type_message": "اكتب رسالة...",
      "add_showcase": "إضافة عرض",
      "title": "العنوان",
      "description": "الوصف",
      "image_url": "رابط الصورة",
      "save": "حفظ",
      "cancel": "إلغاء",
      "no_appointments": "لا توجد مواعيد",
      "no_messages": "لا توجد رسائل",
      "no_services": "لا توجد خدمات مضافة بعد",
      "accept": "قبول",
      "deny": "رفض"
    }
  },
  fr: {
    translation: {
      "app_name": "Clinique Dentaire",
      "home": "Accueil",
      "appointments": "Rendez-vous",
      "chat": "Discussion",
      "admin": "Administration",
      "login": "Connexion",
      "logout": "Déconnexion",
      "book_appointment": "Prendre un rendez-vous",
      "services": "Nos Services",
      "contact_secretary": "Contacter le secrétaire",
      "date": "Date",
      "notes": "Notes",
      "status": "Statut",
      "pending": "En attente",
      "accepted": "Accepté",
      "denied": "Refusé",
      "send": "Envoyer",
      "type_message": "Écrivez un message...",
      "add_showcase": "Ajouter un service",
      "title": "Titre",
      "description": "Description",
      "image_url": "URL de l'image",
      "save": "Enregistrer",
      "cancel": "Annuler",
      "no_appointments": "Aucun rendez-vous",
      "no_messages": "Aucun message",
      "no_services": "Aucun service ajouté",
      "accept": "Accepter",
      "deny": "Refuser"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "ar", // default language
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
