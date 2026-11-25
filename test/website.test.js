// End-to-end tests for the customer website API.
// Uses a throwaway in-memory MongoDB, never the real database.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongo, server, base, mongoose, FootwearModel, InvoiceModel, catalog;
const ADMIN = "owner@example.com";
const codes = []; // OTP codes captured by the fake mailbox

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
  // Fake values set BEFORE the app loads, so the real .env is never used:
  // tests must not send real emails or use real keys.
  process.env.GMAIL_USER = "test-sender@example.com";
  process.env.GMAIL_APP_PASSWORD = "not-a-real-password";
  process.env.UPLOADTHING_SECRET = "sk_test_not_real";
  process.env.WHATSAPP_NUMBER = "919213517228";
  process.env.ADMIN_AUTH_ENFORCED = "false";

  // Fake mailbox: capture codes instead of sending email.
  require("../utils/mailer").useTransportForTests({
    async sendMail(msg) {
      codes.push({ purpose: msg.headers["X-ND-Purpose"], email: msg.to, code: msg.subject.split(" ")[0] });
      return { accepted: [msg.to] };
    },
  });

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
    { ...secret, footwear_id: "black_hi", brand: "Comfort", article: "7712 10X11", category: "Men Casual", color: "Black.",
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
    // Same group, switched on, but no stock: this colour must be hidden.
    { ...secret, footwear_id: "white_empty", brand: "Comfort", article: "7712", category: "Men Casual", color: "White",
      mrp: 1299, selling_price: 850, group_key: "Comfort 7712", show_on_website: true,
      pairs_in_stock: pairs({ 8: [0, 0] }) },
    // Ungrouped, in stock (size 1 only).
    { ...secret, footwear_id: "kids_flex", brand: "Flex", article: "2210", category: "Kids Sports", color: "Blue",
      mrp: 999, selling_price: 649, show_on_website: true, website_first_shown_at: new Date(now - 60 * DAY),
      pairs_in_stock: pairs({ 1: [1, 0], 2: [0, 0] }) },
    // Ungrouped, switched on, nothing in stock: the whole article must be hidden.
    { ...secret, footwear_id: "gone", brand: "Gone", article: "1", category: "Ladies", color: "Red",
      mrp: 999, selling_price: 649, show_on_website: true, pairs_in_stock: pairs({ 5: [0, 0] }) },
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

test("product list shows one card per in-stock colour and hides internal fields", async () => {
  const { status, json, text } = await call("GET", "/public/products");
  assert.equal(status, 200);
  for (const secret of ["cost_price", "SECRET-VENDOR", "444", "internal note", "internal-label", "red_hidden", "quantity"]) {
    assert.ok(!text.includes(secret), `response leaked ${secret}`);
  }
  // Comfort 7712 has two in-stock colours, so two cards (White has no stock); newest first.
  // "Gone" has no stock at all, so it is not listed.
  assert.equal(json.total, 3);
  const [navy, black, flex] = json.items;
  assert.equal(navy.id, "comfort-7712--navy");
  assert.equal(navy.group_id, "comfort-7712");
  assert.equal(navy.price_min, 850);
  assert.deepEqual(navy.colors.map((c) => c.color), ["Navy", "Black"], "own colour first, then the others");
  assert.equal(black.id, "comfort-7712--black");
  assert.equal(black.name, "Comfort 7712", "group name, not one product's article");
  assert.equal(black.in_stock, true);
  assert.equal(black.price_min, 799);
  assert.equal(black.price_max, 899, "both size ranges of black are one card");
  assert.deepEqual(black.colors.map((c) => c.color), ["Black", "Navy"]);
  assert.equal(black.colors[0].image, "https://utfs.io/f/black1.jpg");
  assert.ok(black.tags.includes("Super soft"));
  assert.equal(flex.id, "kids-flex--blue");
  assert.equal(flex.in_stock, true);
  assert.ok(!json.items.some((c) => c.id.includes("white") || c.id.startsWith("gone")), "out of stock is hidden");
  assert.deepEqual(navy.colors.map((c) => c.color), ["Navy", "Black"], "sold-out colour not offered");
  assert.equal((await call("GET", "/public/products/gone")).status, 404);
});

test("product detail merges size ranges of the same colour and lists all colours", async () => {
  const { status, json } = await call("GET", "/public/products/comfort-7712--navy");
  assert.equal(status, 200);
  assert.equal(json.product.selected_color, "comfort-7712--navy");
  assert.deepEqual(json.product.colors.map((c) => c.id), ["comfort-7712--black", "comfort-7712--navy"]);
  // A plain group id still works and opens the first colour.
  assert.equal((await call("GET", "/public/products/comfort-7712")).json.product.selected_color, "comfort-7712--black");
  assert.ok(!JSON.stringify(json).includes("_first_shown"), "internal fields stripped");
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
  const comfort = json.items.find((g) => g.group_id === "comfort-7712");
  const flex = json.items.find((g) => g.group_id === "kids-flex");
  assert.ok(flex.tags.includes("Top selling"));
  assert.ok(!comfort.tags.includes("Top selling"));
  // Only 2 groups exist, so both are inside the "at least 10" new-arrival queue.
  assert.ok(comfort.tags.includes("New arrival") && flex.tags.includes("New arrival"));
});

test("filters and search", async () => {
  const f = (await call("GET", "/public/filters")).json;
  assert.deepEqual(f.categories, ["Kids Sports", "Men Casual"]);
  assert.deepEqual(f.sizes, ["1", "6", "7", "8", "10", "11"]);
  assert.equal((await call("GET", "/public/products?size=9")).json.total, 0);
  assert.equal((await call("GET", "/public/products?size=10")).json.total, 1);
  assert.equal((await call("GET", "/public/products?q=navy")).json.total, 1);
  assert.equal((await call("GET", "/public/products?tag=super%20soft")).json.total, 2, "tags apply to every colour of the article");
  assert.equal((await call("GET", "/public/products?category=kids%20sports")).json.items[0].id, "kids-flex--blue");
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

test("size ranges of a colour are ordered S, M, L, then by first size", () => {
  const make = (id, desc, sizes) => ({
    footwear_id: id, brand: "Combit", article: "SS-1", group_key: "COMBIT SS-1", color: "black",
    selling_price: 100, show_on_website: true, size_description: desc,
    pairs_in_stock: sizes.map((size) => ({ size, available_at: "HOME", quantity: 1 })),
  });
  const [group] = catalog.buildCatalog([
    make("adult", "L", ["7", "8"]),
    make("youth", "M", ["1", "2"]),
    make("kids", "S", ["11", "12", "13"]),
    make("baby", "S", ["6"]),
  ]);
  assert.deepEqual(group.colors[0].sizes.map((s) => s.size), ["6", "11", "12", "13", "1", "2", "7", "8"]);
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

  // Changing the first photo is saved; an empty second slot is dropped.
  await call("POST", "/update_product", { ...base, newImages: ["https://utfs.io/f/old1.jpg", "https://utfs.io/f/old2.jpg"] });
  await call("POST", "/update_product", { ...base, newImages: ["https://utfs.io/f/new1.jpg", null] });
  doc = await FootwearModel.findOne({ footwear_id: "red_hidden" }).lean();
  assert.deepEqual(doc.newImages, ["https://utfs.io/f/new1.jpg"]);

  // An older app version that doesn't send website fields leaves them alone.
  await call("POST", "/update_product", { ...base });
  doc = await FootwearModel.findOne({ footwear_id: "red_hidden" }).lean();
  assert.equal(doc.show_on_website, true);
  assert.equal(doc.website_price, 749);
  assert.deepEqual(doc.newImages, ["https://utfs.io/f/new1.jpg"], "photos kept when not sent");

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
    process.env.ADMIN_AUTH_ENFORCED = "false";
  }
});

test("server refuses to start when a setting is missing", () => {
  const { checkEnv } = require("../utils/env");
  const saved = process.env.WHATSAPP_NUMBER;
  try {
    delete process.env.WHATSAPP_NUMBER;
    assert.throws(checkEnv, /WHATSAPP_NUMBER is not set/);
    process.env.WHATSAPP_NUMBER = "9213517228";
    assert.throws(checkEnv, /country code/);
  } finally {
    process.env.WHATSAPP_NUMBER = saved;
  }
  assert.doesNotThrow(checkEnv);
});
