// End-to-end tests for the customer website API.
// Uses a throwaway in-memory MongoDB, never the real database.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongo, server, base, mongoose, FootwearModel, InvoiceModel, catalog;
const ADMIN = "owner@example.com";
const codes = []; // OTP codes printed by the mailer in dev mode

const DAY = 24 * 60 * 60 * 1000;
const pairs = (spec) =>
  Object.entries(spec).flatMap(([size, [home, shop]]) => [
    { size, available_at: "HOME", quantity: home },
    { size, available_at: "SHOP", quantity: shop },
  ]);

async function call(method, path, body, token) {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

function lastCode(email, purpose) {
  const hit = [...codes].reverse().find((c) => c.email === email && c.purpose === purpose);
  assert.ok(hit, `no ${purpose} code sent to ${email}`);
  return hit.code;
}

before(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-secret-test-secret-test-secret-1234";
  process.env.ADMIN_EMAILS = ADMIN;
  delete process.env.GMAIL_USER;
  const origLog = console.log;
  console.log = (...args) => {
    const m = String(args[0]).match(/^\[dev\] (\w+) code for (\S+): (\d+)/);
    if (m) codes.push({ purpose: m[1], email: m[2], code: m[3] });
    else origLog(...args);
  };

  const app = require("../app");
  mongoose = require("../db/connect");
  FootwearModel = require("../db/models/footwear");
  InvoiceModel = require("../db/models/invoice");
  catalog = require("../db/services/website_catalog");
  await mongoose.connection.asPromise();

  const now = Date.now();
  const secret = { cost_price: 444, vendor: "SECRET-VENDOR", description: "internal note", label: ["internal-label"] };
  await FootwearModel.create([
    // Group "Comfort 7712": black in two size ranges + navy, plus a hidden red one.
    { ...secret, footwear_id: "black_lo", brand: "Comfort", article: "7712", category: "Men Casual", color: "black",
      mrp: 1299, selling_price: 850, website_price: 799, group_key: "Comfort 7712", show_on_website: true,
      website_first_shown_at: new Date(now - 5 * DAY), tags: ["Super soft"],
      website_media: [{ type: "image", url: "https://utfs.io/f/black1.jpg" }],
      pairs_in_stock: pairs({ 6: [1, 0], 7: [0, 2], 8: [1, 1], 9: [0, 0] }) },
    { ...secret, footwear_id: "black_hi", brand: "Comfort", article: "7712", category: "Men Casual", color: "Black",
      mrp: 1399, selling_price: 950, website_price: 899, group_key: "comfort 7712", show_on_website: true,
      website_first_shown_at: new Date(now - 5 * DAY),
      website_media: [{ type: "image", url: "https://utfs.io/f/black1.jpg" }, { type: "image", url: "https://utfs.io/f/black2.jpg" }],
      pairs_in_stock: pairs({ 10: [1, 0], 11: [0, 1] }) },
    { ...secret, footwear_id: "navy", brand: "Comfort", article: "7712", category: "Men Casual", color: "Navy",
      mrp: 1299, selling_price: 850, group_key: "Comfort 7712", show_on_website: true,
      website_first_shown_at: new Date(now - 2 * DAY),
      pairs_in_stock: pairs({ 6: [0, 1], 7: [0, 0] }) },
    { ...secret, footwear_id: "red_hidden", brand: "Comfort", article: "7712", category: "Men Casual", color: "Red",
      mrp: 1299, selling_price: 850, group_key: "Comfort 7712", show_on_website: false,
      pairs_in_stock: pairs({ 6: [5, 5] }) },
    // Ungrouped, out of stock.
    { ...secret, footwear_id: "kids_flex", brand: "Flex", article: "2210", category: "Kids Sports", color: "Blue",
      mrp: 999, selling_price: 649, show_on_website: true, website_first_shown_at: new Date(now - 60 * DAY),
      pairs_in_stock: pairs({ 1: [0, 0], 2: [0, 0] }) },
  ]);
  await InvoiceModel.create([
    { product_id: "kids_flex", invoice_date: new Date(now - 3 * DAY), invoice_status: "COMPLETED" },
    { product_id: "kids_flex", invoice_date: new Date(now - 3 * DAY), invoice_status: "COMPLETED" },
    { product_id: "black_lo", invoice_date: new Date(now - 2 * DAY), invoice_status: "RETURNED" },
    { product_id: "navy", invoice_date: new Date(now - 90 * DAY), invoice_status: "COMPLETED" },
  ]);

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) await new Promise((r) => server.close(r));
  if (mongoose) await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test("product list groups variants, hides internal fields, sorts out-of-stock last", async () => {
  const { status, json, text } = await call("GET", "/public/products");
  assert.equal(status, 200);
  for (const secret of ["cost_price", "SECRET-VENDOR", "444", "internal note", "internal-label", "red_hidden", "quantity"]) {
    assert.ok(!text.includes(secret), `response leaked ${secret}`);
  }
  assert.equal(json.total, 2);
  const [first, second] = json.items;
  assert.equal(first.id, "comfort-7712");
  assert.equal(first.name, "Comfort 7712");
  assert.equal(first.in_stock, true);
  assert.equal(first.price_min, 799);
  assert.equal(first.price_max, 899);
  assert.deepEqual(first.colors.map((c) => c.color), ["Black", "Navy"]);
  assert.equal(first.colors[0].image, "https://utfs.io/f/black1.jpg");
  assert.ok(first.tags.includes("Super soft"));
  assert.equal(second.id, "kids-flex");
  assert.equal(second.in_stock, false);
});

test("product detail merges size ranges of the same colour", async () => {
  const { status, json } = await call("GET", "/public/products/comfort-7712");
  assert.equal(status, 200);
  const black = json.product.colors.find((c) => c.color === "Black");
  assert.deepEqual(black.sizes.map((s) => s.size), ["6", "7", "8", "9", "10", "11"]);
  assert.deepEqual(black.sizes.map((s) => s.in_stock), [true, true, true, false, true, true]);
  assert.equal(black.sizes.find((s) => s.size === "8").price, 799);
  assert.equal(black.sizes.find((s) => s.size === "10").price, 899);
  assert.equal(black.sizes.find((s) => s.size === "10").mrp, 1399);
  assert.deepEqual(black.media.map((m) => m.url), ["https://utfs.io/f/black1.jpg", "https://utfs.io/f/black2.jpg"]);
  const navy = json.product.colors.find((c) => c.color === "Navy");
  assert.equal(navy.sizes[0].price, 850, "falls back to selling price");
  assert.ok(!json.product.colors.some((c) => c.color === "Red"), "hidden product must not appear");
  assert.equal((await call("GET", "/public/products/red_hidden")).status, 404);
});

test("automatic tags: top selling ignores returns and old sales", async () => {
  const { json } = await call("GET", "/public/products");
  const comfort = json.items.find((g) => g.id === "comfort-7712");
  const flex = json.items.find((g) => g.id === "kids-flex");
  assert.ok(flex.tags.includes("Top selling"));
  assert.ok(!comfort.tags.includes("Top selling"));
  // Only 2 groups exist, so both are inside the "at least 10" new-arrival queue.
  assert.ok(comfort.tags.includes("New arrival") && flex.tags.includes("New arrival"));
});

test("filters and search", async () => {
  const f = (await call("GET", "/public/filters")).json;
  assert.deepEqual(f.categories, ["Kids Sports", "Men Casual"]);
  assert.deepEqual(f.sizes, ["6", "7", "8", "10", "11"]);
  assert.equal((await call("GET", "/public/products?size=9")).json.total, 0);
  assert.equal((await call("GET", "/public/products?size=10")).json.total, 1);
  assert.equal((await call("GET", "/public/products?q=navy")).json.total, 1);
  assert.equal((await call("GET", "/public/products?tag=super%20soft")).json.total, 1);
  assert.equal((await call("GET", "/public/products?category=kids%20sports")).json.items[0].id, "kids-flex");
});

test("new arrival queue keeps at least 10 and includes everything from the last 30 days", () => {
  const now = Date.now();
  const make = (i, daysAgo) => ({
    footwear_id: `p${i}`, brand: "B", article: String(i), color: "black", selling_price: 100,
    show_on_website: true, website_first_shown_at: new Date(now - daysAgo * DAY), createdAt: new Date(now - daysAgo * DAY),
    pairs_in_stock: [{ size: "7", available_at: "HOME", quantity: 1 }],
  });
  // 25 groups, all older than 30 days: only the 10 newest keep the tag.
  let groups = catalog.buildCatalog(Array.from({ length: 25 }, (_, i) => make(i, 40 + i)), {}, now);
  let tagged = groups.filter((g) => g.is_new_arrival).map((g) => g.article).sort((a, b) => a - b);
  assert.deepEqual(tagged, ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  // 12 within 30 days: all 12 are new arrivals.
  groups = catalog.buildCatalog(Array.from({ length: 25 }, (_, i) => make(i, i < 12 ? 1 + i : 40 + i)), {}, now);
  assert.equal(groups.filter((g) => g.is_new_arrival).length, 12);
  // A new colour added to an old group makes the group new again.
  const products = Array.from({ length: 12 }, (_, i) => make(i, 40 + i));
  products.push({ ...make(11, 1), footwear_id: "p11-red", color: "red" });
  products.forEach((p) => { if (p.article === "11") p.group_key = "B 11"; });
  groups = catalog.buildCatalog(products, {}, now);
  assert.equal(groups.find((g) => g.id === "b-11").is_new_arrival, true);
});

test("guest order uses database prices and builds a WhatsApp link", async () => {
  const body = {
    name: "Ravi Kumar", phone: "+91 98765 43210",
    address: { line1: "12 Main Road", city: "Gurugram", pincode: "122001" },
    items: [{ sku: "black_lo", size: "8", quantity: 2, price: 1 }, { sku: "black_hi", size: "10", quantity: 1 }],
  };
  const { status, json } = await call("POST", "/public/orders", body);
  assert.equal(status, 201, JSON.stringify(json));
  assert.match(json.order.order_no, /^ND\d{6}-001$/);
  assert.equal(json.order.total, 799 * 2 + 899);
  assert.equal(json.order.customer.phone, "9876543210");
  assert.ok(json.whatsapp_url.startsWith("https://wa.me/919213517228?text="));
  assert.ok(decodeURIComponent(json.whatsapp_url).includes("Comfort 7712 | Black | Size 8 | Qty 2"));
  assert.ok(!JSON.stringify(json).includes("444"));

  const second = await call("POST", "/public/orders", body);
  assert.match(second.json.order.order_no, /-002$/);
});

test("order validation", async () => {
  const ok = { name: "Ravi", phone: "9876543210", address: { line1: "12 Main Road", city: "Gurugram", pincode: "122001" } };
  assert.equal((await call("POST", "/public/orders", { ...ok, items: [{ sku: "black_lo", size: "9", quantity: 1 }] })).status, 409, "out of stock size");
  assert.equal((await call("POST", "/public/orders", { ...ok, items: [{ sku: "red_hidden", size: "6", quantity: 1 }] })).status, 409, "hidden product");
  assert.equal((await call("POST", "/public/orders", { ...ok, phone: "12345", items: [{ sku: "black_lo", size: "8" }] })).status, 400);
  assert.equal((await call("POST", "/public/orders", { ...ok, address: { line1: "x", city: "y", pincode: "12" }, items: [{ sku: "black_lo", size: "8" }] })).status, 400);
  assert.equal((await call("POST", "/public/orders", { ...ok, items: [] })).status, 400);
  assert.equal((await call("POST", "/public/orders", { ...ok, website: "spam", items: [{ sku: "black_lo", size: "8" }] })).status, 400);
});

let customerToken, adminToken;

test("customer signup with email OTP, login, profile and order history", async () => {
  const email = "customer@example.com";
  assert.equal((await call("POST", "/auth/signup", { email, password: "short" })).status, 400);
  assert.equal((await call("POST", "/auth/signup", { email, password: "goodpassword", name: "Asha" })).status, 201);
  assert.equal((await call("POST", "/auth/login", { email, password: "goodpassword" })).status, 403, "unverified");
  assert.equal((await call("POST", "/auth/verify-email", { email, code: "000000" })).status, 400);
  const verified = await call("POST", "/auth/verify-email", { email, code: lastCode(email, "VERIFY_EMAIL") });
  assert.equal(verified.status, 200);
  assert.equal(verified.json.user.is_admin, false);

  assert.equal((await call("POST", "/auth/login", { email, password: "wrongpassword" })).status, 401);
  const login = await call("POST", "/auth/login", { email, password: "goodpassword" });
  assert.equal(login.status, 200);
  customerToken = login.json.token;

  const order = await call("POST", "/public/orders", {
    name: "Asha", phone: "9123456780", address: { line1: "5 Park Lane", city: "Gurugram", pincode: "122002" },
    items: [{ sku: "navy", size: "6", quantity: 1 }],
  }, customerToken);
  assert.equal(order.status, 201);
  const me = await call("GET", "/auth/me", null, customerToken);
  assert.equal(me.json.user.phone, "9123456780", "saved from first order");
  const mine = await call("GET", "/auth/my-orders", null, customerToken);
  assert.equal(mine.json.orders.length, 1);
  assert.equal(mine.json.orders[0].items[0].color, "Navy");

  assert.equal((await call("GET", "/admin/orders", null, customerToken)).status, 401, "customers are not admins");
});

test("password reset logs out old tokens", async () => {
  const email = "customer@example.com";
  await call("POST", "/auth/forgot-password", { email });
  const reset = await call("POST", "/auth/reset-password", { email, code: lastCode(email, "RESET_PASSWORD"), password: "newpassword1" });
  assert.equal(reset.status, 200);
  assert.equal((await call("GET", "/auth/me", null, customerToken)).status, 401);
  assert.equal((await call("POST", "/auth/login", { email, password: "newpassword1" })).status, 200);
});

test("admin login needs a code every time; admin manages orders", async () => {
  await call("POST", "/auth/signup", { email: ADMIN, password: "adminpassword" });
  await call("POST", "/auth/verify-email", { email: ADMIN, code: lastCode(ADMIN, "VERIFY_EMAIL") });
  const step1 = await call("POST", "/auth/login", { email: ADMIN, password: "adminpassword" });
  assert.equal(step1.json.otp_required, true);
  assert.equal(step1.json.token, undefined);
  const step2 = await call("POST", "/auth/admin/verify-login", { email: ADMIN, code: lastCode(ADMIN, "ADMIN_LOGIN") });
  assert.equal(step2.status, 200);
  assert.equal(step2.json.user.is_admin, true);
  adminToken = step2.json.token;

  const list = await call("GET", "/admin/orders", null, adminToken);
  assert.equal(list.status, 200);
  assert.equal(list.json.by_status.NEW, 3);
  const no = list.json.orders[0].order_no;
  assert.equal((await call("POST", `/admin/orders/${no}/status`, { status: "SHIPPED" }, adminToken)).status, 400);
  const upd = await call("POST", `/admin/orders/${no}/status`, { status: "CONFIRMED", note: "Called customer" }, adminToken);
  assert.equal(upd.json.order.status, "CONFIRMED");
  assert.equal(upd.json.order.status_history.at(-1).by, ADMIN);
  assert.equal((await call("GET", "/admin/orders?status=CONFIRMED", null, adminToken)).json.total, 1);
});

test("saving a product from the app handles website fields and the first-shown date", async () => {
  const base = { footwear_id: "red_hidden", brand: "Comfort", article: "7712", pairs_in_stock: pairs({ 6: [5, 5] }) };
  // Switch on with tags, media and website price.
  let r = await call("POST", "/update_product", {
    ...base, show_on_website: true, website_price: "749", tags: [" Soft ", "soft", "New arrival"],
    website_media: ["https://utfs.io/f/red.jpg", "javascript:alert(1)", { type: "video", url: "https://utfs.io/f/red.mp4" }],
  });
  assert.equal(r.status, 200);
  let doc = await FootwearModel.findOne({ footwear_id: "red_hidden" }).lean();
  assert.equal(doc.website_price, 749);
  assert.deepEqual(doc.tags, ["Soft", "New arrival"]);
  assert.deepEqual(doc.website_media, [{ type: "image", url: "https://utfs.io/f/red.jpg" }, { type: "video", url: "https://utfs.io/f/red.mp4" }]);
  const firstShown = doc.website_first_shown_at;
  assert.ok(firstShown);

  // Off and on again: date stays the same.
  await call("POST", "/update_product", { ...base, show_on_website: false });
  await call("POST", "/update_product", { ...base, show_on_website: true });
  doc = await FootwearModel.findOne({ footwear_id: "red_hidden" }).lean();
  assert.equal(doc.website_first_shown_at.getTime(), firstShown.getTime());

  // An older app version that doesn't send website fields leaves them alone.
  await call("POST", "/update_product", { ...base });
  doc = await FootwearModel.findOne({ footwear_id: "red_hidden" }).lean();
  assert.equal(doc.show_on_website, true);
  assert.equal(doc.website_price, 749);

  // Clearing the website price falls back to the selling price.
  await call("POST", "/update_product", { ...base, website_price: "" });
  doc = await FootwearModel.findOne({ footwear_id: "red_hidden" }).lean();
  assert.equal(doc.website_price, undefined);

  // Stock change from an invoice (full document passed back) keeps website fields.
  const productOps = require("../db/services/product_crud");
  const full = (await productOps.view_by_product_id("red_hidden"))[0];
  full.pairs_in_stock[0].quantity = 4;
  await productOps.update_product("red_hidden", full);
  doc = await FootwearModel.findOne({ footwear_id: "red_hidden" }).lean();
  assert.equal(doc.show_on_website, true);
  assert.deepEqual(doc.tags, ["Soft", "New arrival"]);

  assert.equal((await call("POST", "/update_product", { ...base, website_price: "-5" })).status, 400);
  assert.equal((await call("POST", "/update_product", { ...base, footwear_id: "does-not-exist" })).status, 404);

  const keys = await call("GET", "/get_all_group_keys");
  // "Comfort 7712" is used 3 times, "comfort 7712" once: suggest one key.
  assert.deepEqual(keys.json.group_keys, ["Comfort 7712"]);
  const tags = await call("GET", "/get_all_tags");
  assert.ok(tags.json.tags.includes("Super soft") && tags.json.tags.includes("Daily wear"));
});

test("existing app endpoints stay open until ADMIN_AUTH_ENFORCED=true", async () => {
  assert.equal((await call("GET", "/view_all_footwears")).status, 200);
  process.env.ADMIN_AUTH_ENFORCED = "true";
  try {
    assert.equal((await call("GET", "/view_all_footwears")).status, 401);
    assert.equal((await call("GET", "/view_all_footwears", null, customerToken)).status, 401);
    assert.equal((await call("GET", "/view_all_footwears", null, adminToken)).status, 200);
    assert.equal((await call("GET", "/public/products")).status, 200, "public pages stay open");
  } finally {
    delete process.env.ADMIN_AUTH_ENFORCED;
  }
});
