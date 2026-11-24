const Order = require("../models/order");
const catalog = require("./website_catalog");
const cfg = require("../../utils/website_config");
const { cleanText, cleanPhone, cleanAddress } = require("../../utils/validation");

function httpError(status, message, details) {
  const err = new Error(message);
  err.status = status;
  if (details) err.details = details;
  return err;
}

function rupees(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

// "ND" + YYMMDD + "-" + running number for the day, e.g. ND241124-003 (India time).
function datePart(now = new Date()) {
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const y = String(ist.getUTCFullYear()).slice(2);
  const m = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const d = String(ist.getUTCDate()).padStart(2, "0");
  return `ND${y}${m}${d}`;
}

async function nextOrderNo() {
  const prefix = datePart();
  const count = await Order.countDocuments({ order_no: { $regex: `^${prefix}-` } });
  return `${prefix}-${String(count + 1).padStart(3, "0")}`;
}

function whatsappText(order) {
  const lines = [
    `New order ${order.order_no}`,
    "",
    ...order.items.map(
      (it, i) => `${i + 1}. ${it.name} | ${it.color} | Size ${it.size} | Qty ${it.quantity} | ${rupees(it.price * it.quantity)}`
    ),
    "",
    `Total: ${rupees(order.total)}`,
    "",
    `Name: ${order.customer.name}`,
    `Phone: ${order.customer.phone}`,
    `Address: ${[order.address.line1, order.address.line2, order.address.landmark, order.address.city, order.address.pincode]
      .filter(Boolean)
      .join(", ")}`,
  ];
  if (order.note) lines.push(`Note: ${order.note}`);
  return lines.join("\n");
}

function whatsappUrl(order) {
  return `https://wa.me/${process.env.WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText(order))}`;
}

/**
 * Places an order. Prices always come from the database, never from the
 * request. Body: { name, phone, email?, address: {...}, note?, items: [{ sku, size, quantity }] }
 */
async function placeOrder(body, user) {
  body = body || {};
  // Hidden form field that real customers leave empty; bots tend to fill it.
  if (body.website) throw httpError(400, "Could not place the order.");

  const name = cleanText(body.name, 60);
  if (name.length < 2) throw httpError(400, "Enter your name.");
  const phone = cleanPhone(body.phone);
  if (!phone) throw httpError(400, "Enter a valid 10-digit mobile number.");
  const { address, error } = cleanAddress(body.address);
  if (error) throw httpError(400, error);
  const note = cleanText(body.note, 300);

  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (!rawItems.length) throw httpError(400, "Your cart is empty.");
  if (rawItems.length > cfg.MAX_ORDER_ITEMS) throw httpError(400, `You can order up to ${cfg.MAX_ORDER_ITEMS} items at a time.`);

  // Look up live prices and stock (skip the cache so prices are current).
  const groups = await catalog.getCatalog({ fresh: true });
  const index = new Map();
  for (const g of groups) {
    for (const c of g.colors) {
      for (const s of c.sizes) {
        index.set(`${s.sku}|${s.size}`, { group: g, colour: c, size: s });
      }
    }
  }

  const merged = new Map();
  for (const raw of rawItems) {
    const sku = String((raw && raw.sku) || "");
    const size = String((raw && raw.size) || "").trim();
    const qty = parseInt(raw && raw.quantity, 10) || 1;
    if (qty < 1 || qty > cfg.MAX_QUANTITY_PER_ITEM) {
      throw httpError(400, `Quantity must be between 1 and ${cfg.MAX_QUANTITY_PER_ITEM}.`);
    }
    const key = `${sku}|${size}`;
    merged.set(key, Math.min((merged.get(key) || 0) + qty, cfg.MAX_QUANTITY_PER_ITEM));
  }

  const items = [];
  const unavailable = [];
  for (const [key, quantity] of merged) {
    const hit = index.get(key);
    if (!hit || !hit.size.in_stock) {
      unavailable.push(key);
      continue;
    }
    items.push({
      footwear_id: hit.size.sku,
      group_id: hit.group.id,
      name: hit.group.name,
      color: hit.colour.color,
      size: hit.size.size,
      quantity,
      price: hit.size.price,
      mrp: hit.size.mrp || undefined,
      image: (hit.colour.media.find((m) => m.type === "image") || {}).url,
    });
  }
  if (unavailable.length) {
    throw httpError(409, "Some items in your cart are no longer available. Remove them and try again.", {
      unavailable,
    });
  }

  const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  let order;
  for (let attempt = 0; attempt < 4 && !order; attempt++) {
    const order_no =
      attempt < 3 ? await nextOrderNo() : `${datePart()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    try {
      order = await Order.create({
        order_no,
        customer: { name, phone, email: user ? user.email : undefined },
        address,
        note: note || undefined,
        items,
        total,
        user_id: user ? user._id : undefined,
        status_history: [{ status: "NEW", by: "customer" }],
      });
    } catch (err) {
      if (err && err.code === 11000) continue; // same order number taken at the same moment; retry
      throw err;
    }
  }
  if (!order) throw httpError(503, "Could not place the order. Please try again.");

  // Save details to the customer's profile the first time, for next orders.
  if (user) {
    let changed = false;
    if (!user.phone) { user.phone = phone; changed = true; }
    if (!user.name) { user.name = name; changed = true; }
    if (!user.address || !user.address.line1) { user.address = address; changed = true; }
    if (changed) await user.save();
  }

  const plain = order.toObject();
  return {
    order: {
      order_no: plain.order_no,
      status: plain.status,
      items: plain.items,
      total: plain.total,
      customer: plain.customer,
      address: plain.address,
      note: plain.note,
      createdAt: plain.createdAt,
    },
    whatsapp_url: whatsappUrl(plain),
    whatsapp_text: whatsappText(plain),
  };
}

async function listOrders(query = {}) {
  const filter = {};
  if (query.status && cfg.ORDER_STATUSES.includes(query.status)) filter.status = query.status;
  if (query.q) {
    const q = String(query.q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 40);
    filter.$or = [{ order_no: { $regex: q, $options: "i" } }, { "customer.phone": { $regex: q } }, { "customer.name": { $regex: q, $options: "i" } }];
  }
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 30, 1), 100);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const [total, rows, counts] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter, { __v: 0 }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Order.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);
  const by_status = Object.fromEntries(cfg.ORDER_STATUSES.map((s) => [s, 0]));
  for (const c of counts) by_status[c._id] = c.n;
  return { total, page, limit, by_status, orders: rows };
}

async function updateStatus(orderNo, status, note, by) {
  if (!cfg.ORDER_STATUSES.includes(status)) {
    throw httpError(400, `Status must be one of: ${cfg.ORDER_STATUSES.join(", ")}.`);
  }
  const order = await Order.findOne({ order_no: orderNo });
  if (!order) throw httpError(404, "Order not found.");
  if (order.status !== status) {
    order.status = status;
    order.status_history.push({ status, by, note: cleanText(note, 200) || undefined });
    await order.save();
  }
  return order.toObject();
}

module.exports = { placeOrder, listOrders, updateStatus, whatsappText };
