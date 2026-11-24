// Validation for the website-only product fields sent by the admin app.
// Only keys that are present in the request body are touched, so older app
// versions that don't send these fields never overwrite them.

const MAX_MEDIA = 10;
const MAX_TAGS = 15;
const MAX_TAG_LENGTH = 40;

function isHttpUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function cleanTags(tags) {
  if (!Array.isArray(tags)) return [];
  const seen = new Set();
  const result = [];
  for (const raw of tags) {
    if (typeof raw !== "string") continue;
    const tag = raw.trim().replace(/\s+/g, " ").slice(0, MAX_TAG_LENGTH);
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    result.push(tag);
    if (result.length >= MAX_TAGS) break;
  }
  return result;
}

function cleanMedia(media) {
  if (!Array.isArray(media)) return [];
  const seen = new Set();
  const result = [];
  for (const item of media) {
    // Accept either {type, url} objects or plain URL strings.
    const url = typeof item === "string" ? item : item && item.url;
    const type = item && item.type === "video" ? "video" : "image";
    if (!isHttpUrl(url) || seen.has(url)) continue;
    seen.add(url);
    result.push({ type, url });
    if (result.length >= MAX_MEDIA) break;
  }
  return result;
}

/**
 * Returns { $set, $unset } for the website fields present in `body`.
 * Throws an Error with `status = 400` for invalid values.
 */
function websiteUpdateFromBody(body) {
  const $set = {};
  const $unset = {};
  if (!body || typeof body !== "object") return { $set, $unset };

  if ("show_on_website" in body) {
    $set.show_on_website = body.show_on_website === true || body.show_on_website === "true";
  }
  if ("group_key" in body) {
    const key = typeof body.group_key === "string" ? body.group_key.trim() : "";
    if (key.length > 80) throw badRequest("group_key is too long (max 80 characters)");
    if (key) $set.group_key = key;
    else $unset.group_key = "";
  }
  if ("website_price" in body) {
    const raw = body.website_price;
    if (raw === null || raw === "" || raw === undefined) {
      $unset.website_price = "";
    } else {
      const price = Number(raw);
      if (!Number.isFinite(price) || price <= 0) throw badRequest("website_price must be a positive number");
      $set.website_price = Math.round(price * 100) / 100;
    }
  }
  if ("website_media" in body) {
    $set.website_media = cleanMedia(body.website_media);
  }
  if ("tags" in body) {
    $set.tags = cleanTags(body.tags);
  }
  return { $set, $unset };
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

module.exports = { websiteUpdateFromBody, cleanTags, cleanMedia, isHttpUrl, badRequest };
