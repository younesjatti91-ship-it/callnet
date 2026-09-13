export type Language = 'en' | 'fr' | 'ar';

export interface Translations {
  [key: string]: {
    en: string;
    fr: string;
    ar: string;
  };
}

export const translations: Translations = {
  // Navigation
  dashboard: { en: 'Executive Dashboard', fr: 'Tableau de bord', ar: 'لوحة التحكم الرئيسية' },
  orders: { en: 'Orders Center', fr: 'Gestion des Commandes', ar: 'مركز الطلبات' },
  callCenter: { en: 'Call Center Queue', fr: 'Centre d\'Appels', ar: 'مركز الاتصال والتأكيد' },
  couriers: { en: 'Courier Logistics', fr: 'Transporteurs & Logistique', ar: 'شركات الشحن والتوصيل' },
  whatsapp: { en: 'WhatsApp (WAHA)', fr: 'WhatsApp Automatisé', ar: 'واتساب وآها الآلي' },
  finance: { en: 'Finance & Remittance', fr: 'Finances & Rapprochement', ar: 'المالية وتسوية التحصيلات' },
  integrations: { en: 'Integrations', fr: 'Intégrations', ar: 'الربط والتكامل' },
  storesIntegration: { en: 'Stores & Channels', fr: 'Boutiques & E-commerce', ar: 'المتاجر والقنوات' },
  shippingIntegration: { en: 'Shipping Companies', fr: 'Sociétés de Livraison', ar: 'شركات الشحن والتوصيل' },
  admin: { en: 'Admin & Audits', fr: 'Administration & Audits', ar: 'الإدارة وسجل العمليات' },
  operations: { en: 'Operations', fr: 'Opérations', ar: 'العمليات التشغيلية' },
  logout: { en: 'Logout', fr: 'Déconnexion', ar: 'تسجيل الخروج' },
  allOrders: { en: 'All Orders', fr: 'Toutes les commandes', ar: 'جميع الطلبات' },
  statusPending: { en: 'Pending Verification', fr: 'En attente', ar: 'في انتظار التأكيد' },
  statusConfirmed: { en: 'Confirmed', fr: 'Confirmée', ar: 'مؤكدة' },
  statusFulfillment: { en: 'Fulfillment', fr: 'Préparation', ar: 'قيد التجهيز' },
  statusShipped: { en: 'Shipped', fr: 'Expédiée', ar: 'تم الشحن' },
  statusDelivered: { en: 'Delivered', fr: 'Livrée', ar: 'تم التسليم' },
  statusReturned: { en: 'Returned', fr: 'Retournée', ar: 'مرتجعة' },
  statusCancelled: { en: 'Cancelled', fr: 'Annulée', ar: 'ملغاة' },
  accessDenied: { en: 'Access Denied', fr: 'Accès Refusé', ar: 'غير مصرح بالدخول' },

  // Top KPIs
  codPipeline: { en: 'Total COD Pipeline', fr: 'Montant Total COD en Cours', ar: 'إجمالي تدفق الدفع عند الاستلام' },
  netCash: { en: 'Net Cash Collected', fr: 'Total Fonds Encaissés', ar: 'صافي السيولة النقدية المحصلة' },
  confirmationRate: { en: 'Confirmation Rate', fr: 'Taux de Confirmation', ar: 'نسبة تأكيد الطلبات' },
  deliverySuccess: { en: 'Delivery Success', fr: 'Taux de Livraison Réussie', ar: 'نسبة نجاح التوصيل' },
  returnRate: { en: 'Return Rate', fr: 'Taux de Retour', ar: 'نسبة المرتجعات' },
  activeOrders: { en: 'Active Orders', fr: 'Commandes Actives', ar: 'طلبات نشطة' },
  vsLastWeek: { en: 'vs last week', fr: 'par rapport à la semaine dernière', ar: 'مقارنة بالأسبوع الماضي' },
  ordersFinalized: { en: 'orders finalized', fr: 'commandes livrées', ar: 'طلبات تم تسليمها' },
  targetAchieved: { en: 'Target > 80% achieved', fr: 'Objectif > 80% atteint', ar: 'تم تحقيق الهدف > 80%' },

  // Order Lifecycle
  lifecycleTitle: { en: 'Order Lifecycle Progression', fr: 'Progression du Cycle de Commande', ar: 'مراحل دورة حياة الطلبات' },
  lifecycleSubtitle: { en: 'Current live distribution across execution states', fr: 'Répartition en temps réel des statuts', ar: 'التوزيع الفعلي المباشر لمراحل الطلبات' },
  pendingCall: { en: 'Pending Call', fr: 'En attente d\'appel', ar: 'في انتظار الاتصال' },
  confirmed: { en: 'Confirmed', fr: 'Confirmée', ar: 'تم التأكيد' },
  shippedTransit: { en: 'Shipped / Transit', fr: 'Expédiée / En transit', ar: 'تم الشحن / في الطريق' },
  delivered: { en: 'Delivered', fr: 'Livrée', ar: 'تم التسليم' },
  returned: { en: 'Returned', fr: 'Retournée', ar: 'مرتجع' },
  cancelled: { en: 'Cancelled', fr: 'Annulée', ar: 'ملغاة' },
  rescheduled: { en: 'Rescheduled', fr: 'Reprogrammée', ar: 'مؤجل / إعادة جدولة' },

  // Call Center
  callQueueTitle: { en: 'Verification Queue', fr: 'File d\'Attente de Vérification', ar: 'قائمة انتظار التأكيد' },
  openCallQueue: { en: 'Open Call Queue', fr: 'Ouvrir la File d\'Appels', ar: 'فتح قائمة الاتصال' },
  simulateDial: { en: 'Simulate Dial', fr: 'Simuler Appel', ar: 'بدء الاتصال' },
  hangUp: { en: 'Hang Up', fr: 'Raccrocher', ar: 'إنهاء المكالمة' },
  callNotes: { en: 'Call Notes & Feedback', fr: 'Notes d\'Appel & Retour Client', ar: 'ملاحظات الاتصال وتأكيد العميل' },
  confirmOrder: { en: 'Confirm Order', fr: 'Confirmer Commande', ar: 'تأكيد الطلب' },
  noAnswer: { en: 'No Answer', fr: 'Pas de Réponse', ar: 'لا يرد / غير متاح' },
  cancelOrder: { en: 'Cancel Order', fr: 'Annuler Commande', ar: 'إلغاء الطلب' },
  waFollowup: { en: 'WhatsApp Follow-Up (WAHA)', fr: 'Relance WhatsApp (WAHA)', ar: 'متابعة واتساب (نظام وآها)' },
  sendWhatsApp: { en: 'Send WhatsApp', fr: 'Envoyer WhatsApp', ar: 'إرسال عبر واتساب' },

  // Logistics & Couriers
  courierAccounts: { en: 'Configured Courier Accounts', fr: 'Comptes Transporteurs Configurés', ar: 'حسابات شركات الشحن المفعلة' },
  dispatchedShipments: { en: 'Dispatched Shipments', fr: 'Colis Expédiés', ar: 'الشحنات والطرود المرسلة' },
  trackingTimeline: { en: 'Waybill Tracking Timeline', fr: 'Historique de Suivi Transporteur', ar: 'مسار التتبع اللوجستي للشحنة' },
  connectCarrier: { en: 'Connect Carrier', fr: 'Ajouter Transporteur', ar: 'إضافة شركة شحن' },

  // Financial Reconciliation
  reconciliationTitle: { en: 'Financial Reconciliation Portal', fr: 'Portail de Rapprochement Financier', ar: 'بوابة التسوية المالية للتحصيلات' },
  totalRemitted: { en: 'Total Remitted Cash', fr: 'Fonds Virés par Transporteur', ar: 'إجمالي المبالغ المحولة من الشاحن' },
  matchedCount: { en: 'Matched Orders', fr: 'Commandes Rapprochées', ar: 'الطلبات المطابقة 100%' },
  disputedAmount: { en: 'Disputed Cash Amount', fr: 'Écarts & Litiges Financiers', ar: 'المبالغ المتنازع عليها / فروقات' },
  uploadRemittance: { en: 'Upload Remittance File', fr: 'Importer Bordereau Payout', ar: 'رفع ملف التحصيلات البنكية' },
  resolveDecision: { en: 'Resolve Decision', fr: 'Décision de Résolution', ar: 'تسوية النزاع المالي' },

  // WhatsApp
  wahaEngine: { en: 'WAHA Companion Engine', fr: 'Moteur WhatsApp WAHA', ar: 'محرك وآها للواتساب' },
  broadcastCampaign: { en: 'Launch WhatsApp Broadcast Campaign', fr: 'Lancer une Campagne WhatsApp', ar: 'إطلاق حملة بث واتساب' },
  deliveryLogs: { en: 'Message Delivery Logs', fr: 'Journaux d\'Envoi Messages', ar: 'سجل تسليم رسائل الواتساب' },
  deviceActive: { en: 'Device Active & Synchronized', fr: 'Session Appairée & En Ligne', ar: 'الجهاز متصل ومتزامن بنجاح' },

  // Orders table
  orderNumber: { en: 'Order #', fr: 'N° Commande', ar: 'رقم الطلب' },
  customer: { en: 'Customer', fr: 'Client', ar: 'الزبون' },
  status: { en: 'Status', fr: 'Statut', ar: 'الحالة' },
  amount: { en: 'COD Amount', fr: 'Montant COD', ar: 'المبلغ المطلوب' },
  source: { en: 'Source', fr: 'Source', ar: 'المصدر' },
  tracking: { en: 'Tracking #', fr: 'N° de Suivi', ar: 'رقم التتبع' },
  actions: { en: 'Actions', fr: 'Actions', ar: 'إجراءات' },
  newOrder: { en: 'New Order', fr: 'Nouvelle Commande', ar: 'طلب جديد' },
  importCSV: { en: 'Import CSV', fr: 'Importer CSV', ar: 'استيراد CSV' },
  applyFilter: { en: 'Apply Filter', fr: 'Filtrer', ar: 'تطبيق التصفية' },
};
