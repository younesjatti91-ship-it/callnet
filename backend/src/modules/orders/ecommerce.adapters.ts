export interface NormalizedOrderItem {
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface NormalizedOrderPayload {
  storeId?: string;
  externalOrderId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  city?: string;
  province?: string;
  shippingAddress: string;
  subtotal: number;
  shippingFee?: number;
  codAmount: number;
  currency: string;
  source: string;
  notes?: string;
  items: NormalizedOrderItem[];
  metadata?: Record<string, any>;
}

// 1. Shopify Adapter
export class ShopifyAdapter {
  static normalize(payload: any): NormalizedOrderPayload {
    const shipping = payload.shipping_address || payload.billing_address || {};
    const customer = payload.customer || {};

    const firstName = shipping.first_name || customer.first_name || '';
    const lastName = shipping.last_name || customer.last_name || '';
    const customerName = `${firstName} ${lastName}`.trim() || 'Shopify Customer';

    const customerPhone = shipping.phone || customer.phone || payload.phone || '';
    const address = [shipping.address1, shipping.address2, shipping.city, shipping.zip]
      .filter(Boolean)
      .join(', ') || 'No address provided';

    const items: NormalizedOrderItem[] = (payload.line_items || []).map((li: any) => ({
      productName: li.name || li.title || 'Product',
      sku: li.sku || undefined,
      quantity: Number(li.quantity) || 1,
      unitPrice: parseFloat(li.price || '0'),
      totalPrice: parseFloat(li.price || '0') * (Number(li.quantity) || 1),
    }));

    const subtotal = parseFloat(payload.subtotal_price || '0');
    const shippingFee = parseFloat(payload.total_shipping_price_set?.shop_money?.amount || '0');
    const codAmount = parseFloat(payload.total_price || `${subtotal + shippingFee}`);

    return {
      externalOrderId: String(payload.id || payload.order_number || ''),
      customerName,
      customerPhone,
      customerEmail: payload.email || customer.email,
      city: shipping.city,
      province: shipping.province,
      shippingAddress: address,
      subtotal,
      shippingFee,
      codAmount,
      currency: payload.currency || 'MAD',
      source: 'shopify',
      notes: payload.note || 'Imported via Shopify',
      items: items.length > 0 ? items : [{ productName: 'Standard Order', quantity: 1, unitPrice: codAmount, totalPrice: codAmount }],
      metadata: { rawId: payload.id },
    };
  }
}

// 2. YouCan Adapter
export class YouCanAdapter {
  static normalize(payload: any): NormalizedOrderPayload {
    const customer = payload.customer || {};
    const customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || payload.customer_name || 'YouCan Customer';
    const customerPhone = customer.phone || payload.phone || payload.customer_phone || '';
    const shippingAddress = payload.shipping_address || customer.address || payload.address || 'Address not specified';

    const items: NormalizedOrderItem[] = (payload.order_variants || payload.variants || payload.items || []).map((v: any) => ({
      productName: v.product?.name || v.name || v.title || 'YouCan Item',
      sku: v.sku,
      quantity: Number(v.quantity) || 1,
      unitPrice: parseFloat(v.price || '0'),
      totalPrice: parseFloat(v.price || '0') * (Number(v.quantity) || 1),
    }));

    const total = parseFloat(payload.total || payload.subtotal || '0');

    return {
      externalOrderId: String(payload.id || payload.order_id || ''),
      customerName,
      customerPhone,
      customerEmail: customer.email || payload.email,
      city: payload.city || customer.city,
      shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress),
      subtotal: total,
      shippingFee: parseFloat(payload.shipping_cost || '0'),
      codAmount: total,
      currency: payload.currency || 'MAD',
      source: 'youcan',
      notes: payload.note || 'Imported via YouCan',
      items: items.length > 0 ? items : [{ productName: 'YouCan Product', quantity: 1, unitPrice: total, totalPrice: total }],
      metadata: { rawId: payload.id },
    };
  }
}

// 3. Storeep Adapter
export class StoreepAdapter {
  static normalize(payload: any): NormalizedOrderPayload {
    const customer = payload.customer || payload.buyer || {};
    const customerName = customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Storeep Customer';
    const customerPhone = customer.phone || payload.phone || '';
    const address = customer.address || payload.address || customer.city || 'Storeep Address';

    const items: NormalizedOrderItem[] = (payload.items || payload.products || []).map((p: any) => ({
      productName: p.name || p.title || 'Storeep Item',
      sku: p.sku || p.reference,
      quantity: Number(p.quantity || p.qty) || 1,
      unitPrice: parseFloat(p.price || '0'),
      totalPrice: parseFloat(p.price || '0') * (Number(p.quantity || p.qty) || 1),
    }));

    const total = parseFloat(payload.total_amount || payload.total || payload.cod_amount || '0');

    return {
      externalOrderId: String(payload.id || payload.code || payload.reference || ''),
      customerName,
      customerPhone,
      customerEmail: customer.email || payload.email,
      city: customer.city || payload.city,
      shippingAddress: address,
      subtotal: total,
      shippingFee: parseFloat(payload.shipping_price || payload.shipping_fee || '0'),
      codAmount: total,
      currency: payload.currency || 'MAD',
      source: 'storeep',
      notes: payload.notes || payload.comment || 'Imported via Storeep',
      items: items.length > 0 ? items : [{ productName: 'Storeep Item', quantity: 1, unitPrice: total, totalPrice: total }],
      metadata: { rawId: payload.id },
    };
  }
}

// 4. WooCommerce Adapter
export class WooCommerceAdapter {
  static normalize(payload: any): NormalizedOrderPayload {
    const billing = payload.billing || {};
    const shipping = payload.shipping || {};
    const customerName = `${billing.first_name || shipping.first_name || ''} ${
      billing.last_name || shipping.last_name || ''
    }`.trim() || 'WooCommerce Customer';
    const customerPhone = billing.phone || shipping.phone || '';
    const address = [shipping.address_1, shipping.address_2, shipping.city, shipping.state]
      .filter(Boolean)
      .join(', ') || 'WooCommerce Address';

    const items: NormalizedOrderItem[] = (payload.line_items || []).map((li: any) => ({
      productName: li.name || 'Product',
      sku: li.sku,
      quantity: Number(li.quantity) || 1,
      unitPrice: parseFloat(li.price || '0'),
      totalPrice: parseFloat(li.total || (parseFloat(li.price || '0') * (Number(li.quantity) || 1)).toString()),
    }));

    const total = parseFloat(payload.total || '0');
    const shippingFee = parseFloat(payload.shipping_total || '0');

    return {
      externalOrderId: String(payload.id || payload.number || ''),
      customerName,
      customerPhone,
      customerEmail: billing.email,
      city: shipping.city || billing.city,
      province: shipping.state || billing.state,
      shippingAddress: address,
      subtotal: total - shippingFee,
      shippingFee,
      codAmount: total,
      currency: payload.currency || 'MAD',
      source: 'woocommerce',
      notes: payload.customer_note || 'Imported via WooCommerce',
      items: items.length > 0 ? items : [{ productName: 'WooCommerce Item', quantity: 1, unitPrice: total, totalPrice: total }],
      metadata: { rawId: payload.id },
    };
  }
}

// 5. Lightfunnels Adapter
export class LightfunnelsAdapter {
  static normalize(payload: any): NormalizedOrderPayload {
    const order = payload.order || payload;
    const contact = order.contact || order.customer || {};
    const shipping = order.shipping_address || order.shippingAddress || {};

    const customerName = contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Lightfunnels Customer';
    const customerPhone = contact.phone || shipping.phone || order.phone || '';
    const address = [shipping.address, shipping.city, shipping.province]
      .filter(Boolean)
      .join(', ') || 'Lightfunnels Address';

    const items: NormalizedOrderItem[] = (order.items || order.line_items || []).map((it: any) => ({
      productName: it.title || it.name || it.product_title || 'Lightfunnels Product',
      sku: it.sku,
      quantity: Number(it.quantity) || 1,
      unitPrice: parseFloat(it.price || '0'),
      totalPrice: parseFloat(it.price || '0') * (Number(it.quantity) || 1),
    }));

    const total = parseFloat(order.total || order.total_price || '0');
    const shippingFee = parseFloat(order.shipping_total || '0');

    return {
      externalOrderId: String(order.id || order.uuid || ''),
      customerName,
      customerPhone,
      customerEmail: contact.email || order.email,
      city: shipping.city,
      province: shipping.province,
      shippingAddress: address,
      subtotal: total - shippingFee,
      shippingFee,
      codAmount: total,
      currency: order.currency || 'MAD',
      source: 'lightfunnels',
      notes: order.notes || 'Imported via Lightfunnels',
      items: items.length > 0 ? items : [{ productName: 'Lightfunnels Item', quantity: 1, unitPrice: total, totalPrice: total }],
      metadata: { rawId: order.id },
    };
  }
}

// 6. Storeino Adapter
export class StoreinoAdapter {
  static normalize(payload: any): NormalizedOrderPayload {
    const shipping = payload.shipping || payload.address || {};
    const customerName = `${shipping.firstname || ''} ${shipping.lastname || ''}`.trim() || payload.customer_name || 'Storeino Customer';
    const customerPhone = shipping.phone || payload.phone || '';
    const address = [shipping.address, shipping.city, shipping.country]
      .filter(Boolean)
      .join(', ') || 'Storeino Address';

    const items: NormalizedOrderItem[] = (payload.products || payload.items || []).map((p: any) => ({
      productName: p.title || p.name || 'Storeino Product',
      sku: p.sku || p.barcode,
      quantity: Number(p.quantity || p.qty) || 1,
      unitPrice: parseFloat(p.price || '0'),
      totalPrice: parseFloat(p.price || '0') * (Number(p.quantity || p.qty) || 1),
    }));

    const total = parseFloat(payload.total || payload.total_price || '0');

    return {
      externalOrderId: String(payload.id || payload.order_id || ''),
      customerName,
      customerPhone,
      customerEmail: payload.email || shipping.email,
      city: shipping.city || payload.city,
      shippingAddress: address,
      subtotal: total,
      shippingFee: parseFloat(payload.shipping_cost || '0'),
      codAmount: total,
      currency: payload.currency || 'MAD',
      source: 'storeino',
      notes: payload.notes || 'Imported via Storeino',
      items: items.length > 0 ? items : [{ productName: 'Storeino Item', quantity: 1, unitPrice: total, totalPrice: total }],
      metadata: { rawId: payload.id },
    };
  }
}

// 7. EasyOrders Adapter
export class EasyOrdersAdapter {
  static normalize(payload: any): NormalizedOrderPayload {
    const customerName = payload.client_name || payload.customer_name || payload.name || 'EasyOrders Customer';
    const customerPhone = payload.client_phone || payload.phone || payload.telephone || '';
    const city = payload.client_city || payload.city || '';
    const address = payload.client_address || payload.address || `${city}`;

    const items: NormalizedOrderItem[] = (payload.products || payload.items || []).map((p: any) => ({
      productName: p.name || p.product_name || 'EasyOrders Item',
      sku: p.sku,
      quantity: Number(p.quantity || p.qty) || 1,
      unitPrice: parseFloat(p.price || '0'),
      totalPrice: parseFloat(p.total || (parseFloat(p.price || '0') * (Number(p.quantity || p.qty) || 1)).toString()),
    }));

    const total = parseFloat(payload.total_price || payload.total || payload.cod || '0');

    return {
      externalOrderId: String(payload.order_id || payload.id || ''),
      customerName,
      customerPhone,
      customerEmail: payload.email,
      city,
      shippingAddress: address,
      subtotal: total,
      shippingFee: parseFloat(payload.shipping_fee || '0'),
      codAmount: total,
      currency: payload.currency || 'MAD',
      source: 'easyorders',
      notes: payload.notes || payload.remarks || 'Imported via EasyOrders',
      items: items.length > 0 ? items : [{ productName: 'EasyOrders Product', quantity: 1, unitPrice: total, totalPrice: total }],
      metadata: { rawId: payload.order_id || payload.id },
    };
  }
}

// 8. Magento Adapter
export class MagentoAdapter {
  static normalize(payload: any): NormalizedOrderPayload {
    const billing = payload.billing_address || {};
    const shipping = payload.extension_attributes?.shipping_assignments?.[0]?.shipping?.address || payload.shipping_address || billing;

    const customerName = `${shipping.firstname || payload.customer_firstname || ''} ${
      shipping.lastname || payload.customer_lastname || ''
    }`.trim() || 'Magento Customer';
    const customerPhone = shipping.telephone || billing.telephone || '';
    const street = Array.isArray(shipping.street) ? shipping.street.join(', ') : (shipping.street || '');
    const address = [street, shipping.city, shipping.region].filter(Boolean).join(', ') || 'Magento Address';

    const items: NormalizedOrderItem[] = (payload.items || []).map((it: any) => ({
      productName: it.name || 'Magento Item',
      sku: it.sku,
      quantity: Number(it.qty_ordered || it.quantity) || 1,
      unitPrice: parseFloat(it.price || '0'),
      totalPrice: parseFloat(it.row_total || (parseFloat(it.price || '0') * (Number(it.qty_ordered || it.quantity) || 1)).toString()),
    }));

    const total = parseFloat(payload.grand_total || payload.total || '0');
    const shippingFee = parseFloat(payload.shipping_amount || '0');

    return {
      externalOrderId: String(payload.entity_id || payload.increment_id || payload.id || ''),
      customerName,
      customerPhone,
      customerEmail: payload.customer_email || billing.email,
      city: shipping.city,
      province: shipping.region,
      shippingAddress: address,
      subtotal: total - shippingFee,
      shippingFee,
      codAmount: total,
      currency: payload.order_currency_code || payload.currency || 'MAD',
      source: 'magento',
      notes: payload.customer_note || 'Imported via Magento',
      items: items.length > 0 ? items : [{ productName: 'Magento Product', quantity: 1, unitPrice: total, totalPrice: total }],
      metadata: { rawId: payload.entity_id || payload.increment_id },
    };
  }
}

// 9. Simple / Custom API Adapter
export class CustomApiAdapter {
  static normalize(payload: any): NormalizedOrderPayload {
    // Highly resilient vocabulary resolver
    const customerName =
      payload.customerName ||
      payload.customer_name ||
      payload.clientName ||
      payload.client_name ||
      payload.fullName ||
      payload.full_name ||
      payload.name ||
      payload.buyer ||
      'Direct API Customer';

    const customerPhone =
      payload.customerPhone ||
      payload.customer_phone ||
      payload.phone ||
      payload.telephone ||
      payload.mobile ||
      payload.tel ||
      payload.gsm ||
      '';

    const city =
      payload.city ||
      payload.ville ||
      payload.destination_city ||
      '';

    const address =
      payload.shippingAddress ||
      payload.shipping_address ||
      payload.address ||
      payload.adresse ||
      payload.delivery_address ||
      city ||
      'Direct API Address';

    const codAmount = parseFloat(
      payload.codAmount ||
      payload.cod_amount ||
      payload.total ||
      payload.totalPrice ||
      payload.total_price ||
      payload.amount ||
      payload.prix ||
      payload.price ||
      '0'
    );

    const shippingFee = parseFloat(
      payload.shippingFee ||
      payload.shipping_fee ||
      payload.shipping_cost ||
      payload.frais_livraison ||
      '0'
    );

    const itemsRaw = payload.items || payload.products || payload.articles || payload.line_items || [];
    let items: NormalizedOrderItem[] = [];

    if (Array.isArray(itemsRaw) && itemsRaw.length > 0) {
      items = itemsRaw.map((it: any) => {
        const qty = Number(it.quantity || it.qty || it.qte || 1);
        const price = parseFloat(it.unitPrice || it.unit_price || it.price || it.prix || '0');
        return {
          productName: it.productName || it.product_name || it.name || it.title || it.produit || 'Custom Item',
          sku: it.sku || it.reference,
          quantity: qty,
          unitPrice: price,
          totalPrice: parseFloat(it.totalPrice || it.total_price || (price * qty).toString()),
        };
      });
    } else {
      const singleProduct = payload.product || payload.produit || payload.productName || payload.product_name || 'Direct API Order';
      const singleQty = Number(payload.quantity || payload.qty || payload.qte || 1);
      items = [{
        productName: singleProduct,
        quantity: singleQty,
        unitPrice: codAmount / singleQty || codAmount,
        totalPrice: codAmount,
      }];
    }

    return {
      externalOrderId: String(payload.orderId || payload.order_id || payload.id || payload.ref || payload.code || Date.now()),
      customerName,
      customerPhone,
      customerEmail: payload.customerEmail || payload.email,
      city,
      province: payload.province || payload.region,
      shippingAddress: address,
      subtotal: codAmount - shippingFee,
      shippingFee,
      codAmount,
      currency: payload.currency || payload.devise || 'MAD',
      source: 'custom_api',
      notes: payload.notes || payload.note || payload.comment || 'Imported via Custom API',
      items,
      metadata: payload.metadata || {},
    };
  }
}

// 10. Google Sheets Adapter
export class GoogleSheetsAdapter {
  static normalizeRow(
    row: Record<string, any> | any[],
    headers: string[],
    mapping: Record<string, string> // e.g. { customerName: 'Nom', customerPhone: 'GSM', ... }
  ): NormalizedOrderPayload {
    // If row is an array, transform into header-keyed object
    const rowObj: Record<string, any> = {};
    if (Array.isArray(row)) {
      headers.forEach((h, idx) => {
        rowObj[h] = row[idx] !== undefined ? row[idx] : '';
      });
    } else {
      Object.assign(rowObj, row);
    }

    const getValue = (canonicalKey: string): any => {
      const headerName = mapping[canonicalKey];
      if (headerName && rowObj[headerName] !== undefined) {
        return rowObj[headerName];
      }
      return '';
    };

    const customerName = String(getValue('customerName') || 'Google Sheets Customer').trim();
    const customerPhone = String(getValue('customerPhone') || '').trim();
    const city = String(getValue('city') || '').trim();
    const address = String(getValue('shippingAddress') || getValue('address') || city || 'No Address').trim();
    const codAmount = parseFloat(String(getValue('codAmount') || getValue('price') || getValue('total') || '0').replace(/[^0-9.-]/g, '')) || 0;
    const productName = String(getValue('productName') || getValue('product') || 'Sheet Item').trim();
    const qty = parseInt(String(getValue('quantity') || getValue('qty') || '1'), 10) || 1;
    const notes = String(getValue('notes') || getValue('remark') || '').trim();
    const externalOrderId = String(getValue('orderId') || getValue('id') || `GS-${Date.now()}-${Math.floor(Math.random() * 1000)}`);

    return {
      externalOrderId,
      customerName,
      customerPhone,
      city,
      shippingAddress: address,
      subtotal: codAmount,
      shippingFee: 0,
      codAmount,
      currency: 'MAD',
      source: 'google_sheets',
      notes: notes ? `Google Sheets: ${notes}` : 'Imported via Google Sheets',
      items: [
        {
          productName,
          quantity: qty,
          unitPrice: codAmount / qty || codAmount,
          totalPrice: codAmount,
        },
      ],
    };
  }
}
