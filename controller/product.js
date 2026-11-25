const { SUCCESS, SERVER_CRASH, NOT_FOUND } =
  require("../utils/config").STATUS_CODES;
const uniqid = require("uniqid");
const messageBundle = require("../locales/en");
const productOperations = require("../db/services/product_crud");
const { websiteUpdateFromBody } = require("../utils/website_fields");
const productController = {
  add(request, response) {
    let footwearObject = request.body;
    try {
      // Validate website fields and replace raw values with cleaned ones.
      const { $set } = websiteUpdateFromBody(footwearObject);
      for (const key of ["show_on_website", "group_key", "website_price", "website_media", "tags"]) {
        delete footwearObject[key];
      }
      Object.assign(footwearObject, $set);
    } catch (err) {
      return response.status(err.status || 400).json({ message: err.message });
    }
    footwearObject.footwear_id = uniqid(
      footwearObject.category.split(" ").join("_")
    );
    footwearObject.out_of_stock = false;
    let promise = productOperations.add_product(footwearObject);
    promise
      .then((doc) => {
        response
          .status(SUCCESS)
          .json({ message: messageBundle["product.added"], doc: doc });
      })
      .catch((err) => {
        response
          .status(SERVER_CRASH)
          .json({ message: messageBundle["product.failed"], ERROR: err });
      });
  },
  async apply_changes(request, response) {
    await productOperations.applyChanges();
    response.status(SUCCESS).json({ message: messageBundle['successful'] });
  },
  async view_all_products(request, response) {
    try {
      let footwears = await productOperations.view_all_products();
      if (footwears) {
        response.status(SUCCESS).json({
          message: messageBundle["product.found"],
          footwears: footwears,
        });
      } else {
        response
          .status(NOT_FOUND)
          .json({ message: messageBundle["product.notfound"] });
      }
    } catch (err) {
      response
        .status(SERVER_CRASH)
        .json({ message: messageBundle["unsuccessful"], ERROR: err });
    }
  },
  async filter_footwears(request, response) {
    try {
      let filter = request.body;
      let footwears = await productOperations.filter_footwears(filter);
      if (footwears) {
        response.status(SUCCESS).json({
          message: messageBundle["product.found"],
          footwears: footwears,
        });
      } else {
        response
          .status(NOT_FOUND)
          .json({ message: messageBundle["product.notfound"] });
      }
    } catch (err) {
      response
        .status(SERVER_CRASH)
        .json({ message: messageBundle["unsuccessful"], ERROR: err });
    }
  },
  async view_by_product_id(request, response) {
    try {
      let footwear_id = request.query.footwear_id;
      let footwear = await productOperations.view_by_product_id(footwear_id);
      if (footwear) {
        response.status(SUCCESS).json({
          message: messageBundle["product.found"],
          footwear: footwear,
        });
      } else {
        response
          .status(NOT_FOUND)
          .json({ message: messageBundle["product.notfound"] });
      }
    } catch (err) {
      response
        .status(SERVER_CRASH)
        .json({ message: messageBundle["unsuccessful"], ERROR: err });
    }
  },
  async get_all_articles(request, response) {
    try {
      let articles = await productOperations.get_all_articles();
      response.status(SUCCESS).json({ "articles": articles });
    } catch (err) {
      response
        .status(SERVER_CRASH)
        .json({ message: messageBundle["unsuccessful"], ERROR: err });
    }
  },
  async get_all_labels(request, response) {
    try {
      let labels = await productOperations.get_all_labels();
      response.status(SUCCESS).json({ "labels": labels });
    } catch (err) {
      response
        .status(SERVER_CRASH)
        .json({ message: messageBundle["unsuccessful"], ERROR: err });
    }
  },
  async get_all_group_keys(request, response) {
    try {
      const groupKeys = await productOperations.get_all_group_keys();
      response.status(SUCCESS).json({ group_keys: groupKeys });
    } catch (err) {
      response.status(SERVER_CRASH).json({ message: messageBundle["unsuccessful"] });
    }
  },
  async get_all_tags(request, response) {
    try {
      const { DEFAULT_TAGS } = require("../utils/website_config");
      const used = await productOperations.get_all_tags();
      const seen = new Set();
      const tags = [...DEFAULT_TAGS, ...used].filter((t) => {
        const k = t.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      response.status(SUCCESS).json({ tags });
    } catch (err) {
      response.status(SERVER_CRASH).json({ message: messageBundle["unsuccessful"] });
    }
  },
  async update_product(request, response) {
    try {
      let footwear_id = request.body.footwear_id;
      let footwearObject = {
        brand: request.body.brand,
        sub_brand: request.body.sub_brand,
        article: request.body.article,
        mrp: request.body.mrp,
        selling_price: request.body.selling_price,
        cost_price: request.body.cost_price,
        category: request.body.category,
        color: request.body.color,
        pairs_in_stock: request.body.pairs_in_stock,
        size_range: request.body.size_range,
        description: request.body.description,
        images: request.body.images,
        vendor: request.body.vendor,
        out_of_stock: request.body.out_of_stock,
        label: request.body.label,
        rating: request.body.rating,
        update: request.body.update,
        size_description: request.body.size_description,
        // The app sends its photos as "newImages" (first photo, second photo).
        newImages: request.body.newImages,
      };
      let websiteUpdate;
      try {
        websiteUpdate = websiteUpdateFromBody(request.body);
      } catch (err) {
        return response.status(err.status || 400).json({ message: err.message });
      }
      let product = await productOperations.update_product(
        footwear_id,
        footwearObject,
        websiteUpdate
      );
      if (websiteUpdate.$set.show_on_website === true) {
        await productOperations.mark_first_shown_on_website(footwear_id);
      }
      if (product && product.matchedCount) {
        response.status(SUCCESS).json({
          message: messageBundle["update.successful"],
          Product: footwearObject,
        });
      } else {
        // Previously no response was sent here, leaving the app waiting.
        response
          .status(NOT_FOUND)
          .json({ message: messageBundle["update.unsuccessful"] });
      }
    } catch (err) {
      response
        .status(SERVER_CRASH)
        .json({ message: messageBundle["unsuccessful"], ERROR: err });
    }
  },
  async delete_product(request, response) {
    try {
      let footwear_id = request.query.footwear_id;
      let product = await productOperations.delete_product(footwear_id);
      if (product.deletedCount && footwear_id) {
        response
          .status(SUCCESS)
          .json({ message: messageBundle["delete.successful"] });
      } else {
        response
          .status(NOT_FOUND)
          .json({ message: messageBundle["delete.unsuccessful"] });
      }
    } catch (err) {
      response
        .status(SERVER_CRASH)
        .json({ message: messageBundle["unsuccessful"], ERROR: err });
    }
  },
};
module.exports = productController;
