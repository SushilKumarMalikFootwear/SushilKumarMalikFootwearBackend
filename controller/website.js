const catalog = require("../db/services/website_catalog");
const orders = require("../db/services/website_orders");
const cfg = require("../utils/website_config");

module.exports = {
  // GET /public/products?category=&tag=&size=&q=&min_price=&max_price=&sort=&page=&limit=
  async listProducts(req, res, next) {
    try {
      const cards = await catalog.getCards();
      const result = catalog.queryCatalog(cards, req.query);
      res.set("Cache-Control", "public, max-age=60");
      res.json({ ...result, items: result.items.map(catalog.toCard) });
    } catch (err) {
      next(err);
    }
  },

  // GET /public/products/:id   (id = "<group>--<colour>" from a card, or a group id)
  async getProduct(req, res, next) {
    try {
      const groups = await catalog.getCatalog();
      const found = catalog.findProduct(groups, req.params.id);
      if (!found) return res.status(404).json({ message: "This product is not available." });
      res.set("Cache-Control", "public, max-age=60");
      res.json({ product: { ...catalog.toDetail(found.group), selected_color: found.selected_color } });
    } catch (err) {
      next(err);
    }
  },

  // GET /public/filters
  async filters(req, res, next) {
    try {
      const groups = await catalog.getCatalog();
      res.set("Cache-Control", "public, max-age=300");
      res.json(catalog.filtersFrom(groups));
    } catch (err) {
      next(err);
    }
  },

  // GET /public/store
  storeInfo(req, res) {
    res.set("Cache-Control", "public, max-age=3600");
    res.json({
      name: cfg.SHOP_NAME,
      whatsapp: process.env.WHATSAPP_NUMBER,
      stores: [
        { name: "N.D. Footwear (Home store)", map_url: "https://maps.app.goo.gl/u9RsuT267dCJCDCW6", lat: 28.4516267, lng: 77.0204276, hours: null },
        { name: "N.D. Footwear (Sadar Bazar)", map_url: "https://maps.app.goo.gl/RELcQ5tM9S5GGYYY6", lat: 28.4605432, lng: 77.0284808, hours: null },
      ],
      delivery: "Local delivery first. Parcel or Porter for other areas.",
    });
  },

  // POST /public/orders
  async placeOrder(req, res, next) {
    try {
      const result = await orders.placeOrder(req.body, req.user || null);
      res.status(201).json(result);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ message: err.message, ...(err.details || {}) });
      next(err);
    }
  },

  // GET /admin/orders?status=&page=&limit=&q=
  async adminListOrders(req, res, next) {
    try {
      res.json(await orders.listOrders(req.query));
    } catch (err) {
      next(err);
    }
  },

  // POST /admin/orders/:order_no/status  { status, note }
  async adminUpdateStatus(req, res, next) {
    try {
      const order = await orders.updateStatus(req.params.order_no, req.body.status, req.body.note, req.user && req.user.email);
      res.json({ order });
    } catch (err) {
      if (err.status) return res.status(err.status).json({ message: err.message });
      next(err);
    }
  },

  // POST /admin/uploads/presign  { name, size, type }
  // Returns a one-time upload URL so the app never holds the UploadThing key.
  async presignUpload(req, res, next) {
    try {
      const key = process.env.UPLOADTHING_SECRET.trim();
      const name = String(req.body.name || "photo.jpg").slice(0, 120);
      const size = Number(req.body.size);
      const type = String(req.body.type || "");
      const isImage = /^image\/(jpeg|png|webp|gif|heic|heif)$/.test(type);
      const isVideo = /^video\/(mp4|webm|quicktime)$/.test(type);
      if (!isImage && !isVideo) return res.status(400).json({ message: "Only photos (JPG, PNG, WEBP) and videos (MP4) can be uploaded." });
      const maxBytes = isImage ? 8 * 1024 * 1024 : 64 * 1024 * 1024;
      if (!Number.isFinite(size) || size <= 0 || size > maxBytes) {
        return res.status(400).json({ message: `File is too large. Limit is ${maxBytes / 1024 / 1024} MB.` });
      }
      const resp = await fetch("https://api.uploadthing.com/v6/uploadFiles", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Uploadthing-Api-Key": key },
        body: JSON.stringify({
          files: [{ name, size, type }],
          acl: "public-read",
          contentDisposition: "inline",
        }),
      });
      if (!resp.ok) {
        console.error("UploadThing presign failed", resp.status, await resp.text().catch(() => ""));
        return res.status(502).json({ message: "Could not start the upload. Try again." });
      }
      const data = await resp.json();
      const info = data && data.data && data.data[0];
      if (!info) return res.status(502).json({ message: "Could not start the upload. Try again." });
      res.json({ url: info.url, fields: info.fields || {}, file_url: info.fileUrl });
    } catch (err) {
      next(err);
    }
  },
};
