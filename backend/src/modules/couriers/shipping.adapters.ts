export type CanonicalShipmentStatus =
  | 'created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed_attempt'
  | 'returned'
  | 'cancelled';

export interface CourierNormalizedStatus {
  canonicalStatus: CanonicalShipmentStatus;
  rawStatus: string;
  location?: string;
  notes?: string;
  deliveredAt?: Date;
  cashCollected?: number;
}

export interface CourierShipmentPayload {
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  codAmount: number;
  orderNumber: string;
  declaredValue?: number;
  productDescription?: string;
  quantity?: number;
  allowOpen?: boolean;
}

export class ShippingStatusNormalizer {
  /**
   * Resiliently normalizes status strings across all 10 Moroccan & MENA courier companies
   */
  static normalize(companyCode: string, rawStatus: string): CourierNormalizedStatus {
    const raw = (rawStatus || '').toLowerCase().trim();

    // 1. Delivered patterns
    if (
      raw.includes('livre') ||
      raw.includes('delivered') ||
      raw.includes('completed') ||
      raw.includes('livrée') ||
      raw.includes('تم التوصيل') ||
      raw.includes('تم التسليم') ||
      raw === 'livré'
    ) {
      return { canonicalStatus: 'delivered', rawStatus, deliveredAt: new Date() };
    }

    // 2. Returned patterns
    if (
      raw.includes('retour') ||
      raw.includes('returned') ||
      raw.includes('return_to_sender') ||
      raw.includes('refuse') ||
      raw.includes('refusé') ||
      raw.includes('refused') ||
      raw.includes('مرتجع') ||
      raw.includes('إرجاع')
    ) {
      return { canonicalStatus: 'returned', rawStatus };
    }

    // 3. Failed attempt / unreachable
    if (
      raw.includes('echec') ||
      raw.includes('échec') ||
      raw.includes('failed') ||
      raw.includes('unreachable') ||
      raw.includes('non_abouti') ||
      raw.includes('reporte') ||
      raw.includes('reporté') ||
      raw.includes('pas de reponse') ||
      raw.includes('تعذر')
    ) {
      return { canonicalStatus: 'failed_attempt', rawStatus };
    }

    // 4. Out for delivery / Distribution
    if (
      raw.includes('out_for_delivery') ||
      raw.includes('distribution') ||
      raw.includes('en_distribution') ||
      raw.includes('en cours de livraison') ||
      raw.includes('delivery_in_progress') ||
      raw.includes('خرج للتوصيل') ||
      raw.includes('قيد التوصيل')
    ) {
      return { canonicalStatus: 'out_for_delivery', rawStatus };
    }

    // 5. In transit / Hub
    if (
      raw.includes('transit') ||
      raw.includes('hub') ||
      raw.includes('expedie') ||
      raw.includes('expédié') ||
      raw.includes('acheminement') ||
      raw.includes('en_cours') ||
      raw.includes('في الطريق') ||
      raw.includes('في المستودع')
    ) {
      return { canonicalStatus: 'in_transit', rawStatus };
    }

    // 6. Picked up / Enlevement
    if (
      raw.includes('pickup') ||
      raw.includes('picked_up') ||
      raw.includes('ramasse') ||
      raw.includes('ramassé') ||
      raw.includes('enlevement') ||
      raw.includes('enlèvement') ||
      raw.includes('prise_en_charge') ||
      raw.includes('تم الاستلام')
    ) {
      return { canonicalStatus: 'picked_up', rawStatus };
    }

    // 7. Cancelled
    if (
      raw.includes('annule') ||
      raw.includes('annulé') ||
      raw.includes('cancelled') ||
      raw.includes('ملغي')
    ) {
      return { canonicalStatus: 'cancelled', rawStatus };
    }

    // Default to created / registered
    return { canonicalStatus: 'created', rawStatus };
  }
}

/**
 * Transforms generic COD Flow order shipment request into courier-specific booking payloads
 */
export class CourierBookingAdapter {
  static toIrsaliyat(payload: CourierShipmentPayload) {
    return {
      nom_destinataire: payload.recipientName,
      telephone: payload.recipientPhone,
      adresse: payload.recipientAddress,
      ville: payload.recipientCity,
      crbt: payload.codAmount,
      ref_commande: payload.orderNumber,
      remarque: payload.productDescription || '',
      ouvrir_colis: payload.allowOpen ? 1 : 0,
    };
  }

  static toOnessta(payload: CourierShipmentPayload) {
    return {
      client_name: payload.recipientName,
      phone: payload.recipientPhone,
      address: payload.recipientAddress,
      destination_city: payload.recipientCity,
      price: payload.codAmount,
      order_id: payload.orderNumber,
      notes: payload.productDescription || '',
      parcel_count: payload.quantity || 1,
    };
  }

  static toForcelog(payload: CourierShipmentPayload) {
    return {
      receiver: {
        full_name: payload.recipientName,
        phone_number: payload.recipientPhone,
        address: payload.recipientAddress,
        city: payload.recipientCity,
      },
      cod_value: payload.codAmount,
      merchant_reference: payload.orderNumber,
      item_details: payload.productDescription || 'E-commerce goods',
    };
  }

  static toAmeex(payload: CourierShipmentPayload) {
    return {
      destinataire: payload.recipientName,
      telephone: payload.recipientPhone,
      adresse_livraison: payload.recipientAddress,
      ville_destination: payload.recipientCity,
      montant_crbt: payload.codAmount,
      reference_externe: payload.orderNumber,
      designation: payload.productDescription || '',
    };
  }

  static toCathedis(payload: CourierShipmentPayload) {
    return {
      customer: {
        name: payload.recipientName,
        gsm: payload.recipientPhone,
        address: payload.recipientAddress,
        city: payload.recipientCity,
      },
      cod: payload.codAmount,
      order_ref: payload.orderNumber,
      description: payload.productDescription || '',
      can_open: payload.allowOpen ? true : false,
    };
  }

  static toChronoDiali(payload: CourierShipmentPayload) {
    return {
      nom_client: payload.recipientName,
      tel_client: payload.recipientPhone,
      adresse_client: payload.recipientAddress,
      ville: payload.recipientCity,
      montant_a_encaisser: payload.codAmount,
      code_barre_client: payload.orderNumber,
      commentaire: payload.productDescription || '',
    };
  }

  static toSendit(payload: CourierShipmentPayload) {
    return {
      recipient: {
        name: payload.recipientName,
        phone: payload.recipientPhone,
        address: payload.recipientAddress,
        city: payload.recipientCity,
      },
      cod_amount: payload.codAmount,
      external_id: payload.orderNumber,
      package_info: {
        description: payload.productDescription || 'Merchandise',
        units: payload.quantity || 1,
      },
    };
  }

  static toOzonExpress(payload: CourierShipmentPayload) {
    return {
      recipient_name: payload.recipientName,
      phone_number: payload.recipientPhone,
      shipping_address: payload.recipientAddress,
      destination_city: payload.recipientCity,
      cod_fee: payload.codAmount,
      order_number: payload.orderNumber,
      allow_inspection: payload.allowOpen || false,
    };
  }

  static toDigylog(payload: CourierShipmentPayload) {
    return {
      destinataire_nom: payload.recipientName,
      destinataire_tel: payload.recipientPhone,
      destinataire_adresse: payload.recipientAddress,
      destinataire_ville: payload.recipientCity,
      montant_cod: payload.codAmount,
      ref_client: payload.orderNumber,
      remarques: payload.productDescription || '',
    };
  }

  static toKargoExpress(payload: CourierShipmentPayload) {
    return {
      consignee_name: payload.recipientName,
      consignee_phone: payload.recipientPhone,
      consignee_address: payload.recipientAddress,
      consignee_city: payload.recipientCity,
      cash_on_delivery: payload.codAmount,
      tracking_ref: payload.orderNumber,
      declared_value: payload.declaredValue || payload.codAmount,
    };
  }
}

/**
 * Universal webhook parser for courier tracking callbacks
 */
export class CourierWebhookParser {
  static parse(companyCode: string, payload: any): {
    trackingNumber: string;
    canonicalStatus: CanonicalShipmentStatus;
    rawStatus: string;
    location?: string;
    notes?: string;
    cashCollected?: number;
  } {
    const rawStatus =
      payload.status ||
      payload.statut ||
      payload.etat ||
      payload.current_status ||
      payload.status_code ||
      payload.event ||
      '';

    const trackingNumber = String(
      payload.tracking_number ||
      payload.tracking_id ||
      payload.code_suivi ||
      payload.numero_colis ||
      payload.tracking ||
      payload.reference ||
      ''
    );

    const location =
      payload.location ||
      payload.ville ||
      payload.hub ||
      payload.city ||
      payload.agence ||
      undefined;

    const notes =
      payload.notes ||
      payload.commentaire ||
      payload.reason ||
      payload.motif ||
      payload.description ||
      undefined;

    const cashCollected = parseFloat(
      payload.cash_collected ||
      payload.montant_encaisse ||
      payload.amount_collected ||
      payload.crbt_encaisse ||
      '0'
    );

    const normalized = ShippingStatusNormalizer.normalize(companyCode, rawStatus);

    return {
      trackingNumber,
      canonicalStatus: normalized.canonicalStatus,
      rawStatus,
      location,
      notes,
      cashCollected: cashCollected > 0 ? cashCollected : undefined,
    };
  }
}
