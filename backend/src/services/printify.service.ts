import type { ShippingAddress } from '@scentresort/shared';

const PRINTIFY_API_BASE = 'https://api.printify.com/v1';

function getConfig() {
  const token = process.env.PRINTIFY_API_TOKEN;
  const shopId = process.env.PRINTIFY_SHOP_ID;
  const blueprintId = process.env.PRINTIFY_STICKER_BLUEPRINT_ID;
  const variantId = process.env.PRINTIFY_STICKER_VARIANT_ID;

  if (!token || !shopId || !blueprintId || !variantId) {
    throw new Error('Printify environment variables not configured');
  }

  return { token, shopId, blueprintId, variantId };
}

async function printifyFetch(path: string, options: RequestInit = {}) {
  const { token } = getConfig();
  const res = await fetch(`${PRINTIFY_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Printify API error ${res.status}: ${body}`);
  }

  return res.json();
}

export async function createPrintifyOrder(
  spinId: string,
  address: ShippingAddress
): Promise<string> {
  const { shopId, blueprintId, variantId } = getConfig();

  const nameParts = address.fullName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const order = await printifyFetch(`/shops/${shopId}/orders.json`, {
    method: 'POST',
    body: JSON.stringify({
      external_id: spinId,
      line_items: [
        {
          product_id: blueprintId,
          variant_id: parseInt(variantId, 10),
          quantity: 1,
        },
      ],
      shipping_method: 1, // standard
      send_shipping_notification: true,
      address_to: {
        first_name: firstName,
        last_name: lastName,
        address1: address.line1,
        address2: address.line2 || '',
        city: address.city,
        region: address.state,
        zip: address.postalCode,
        country: address.country || 'US',
      },
    }),
  });

  return order.id;
}

export async function getPrintifyOrderStatus(orderId: string): Promise<string> {
  const { shopId } = getConfig();
  const order = await printifyFetch(`/shops/${shopId}/orders/${orderId}.json`);
  return order.status;
}
