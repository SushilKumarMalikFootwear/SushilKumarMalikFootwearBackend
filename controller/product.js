const { SUCCESS, SERVER_CRASH, NOT_FOUND } =
  require("../utils/config").STATUS_CODES;
const uniqid = require("uniqid");
const messageBundle = require("../locales/en");
const productOperations = require("../db/services/product_crud");
const productController = {
  add(request, response) {
    let footwearObject = request.body;
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
    response.status(SUCCESS).json({message : messageBundle['successful']});
  },
  async view_all_products(request, response) {
    try {
      let out_of_stock = request.query.out_of_stock;
      let footwears = await productOperations.view_all_products(out_of_stock);
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
      let out_of_stock = request.query.out_of_stock;
      let filter = request.body;
      let footwears = await productOperations.filter_footwears(
        filter,
        out_of_stock
      );
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
  async view_45_products(request, response) {
    try {
      let skip = request.query.skip;
      let limit = request.query.limit;
      if (request.query.rating) {
        rating = request.query.rating;
      } else {
        rating = 0;
      }
      let products = await productOperations.view_45_products(
        parseInt(skip),
        parseInt(limit),
        rating
      );
      if (products) {
        response.status(SUCCESS).json({
          message: messageBundle["product.found"],
          Products: products.products,
          Total_products: products.total_products,
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
  async view_by_interest(request, response) {
    try {
      let token = request.headers["authorization"];
      let doc = jwt.getdoc(token);
      if (request.query.rating) {
        rating = request.query.rating;
      } else {
        rating = 0;
      }
      let products = await productOperations.find_by_interest(
        doc.interested_in,
        rating
      );
      if (products) {
        response.status(SUCCESS).json({
          message: messageBundle["product.found"],
          AllProducts: products,
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
  async view_by_name(request, response) {
    try {
      let name = request.query.name;
      if (request.query.rating) {
        rating = request.query.rating;
      } else {
        rating = 0;
      }
      let products = await productOperations.view_by_name(name, rating);
      if (products) {
        response.status(SUCCESS).json({
          message: messageBundle["product.found"],
          AllProducts: products,
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
  async view_by_category(request, response) {
    try {
      let category = request.query.category;
      if (request.query.rating) {
        rating = request.query.rating;
      } else {
        rating = 0;
      }
      let products = await productOperations.view_by_category(category, rating);
      if (products) {
        response.status(SUCCESS).json({
          message: messageBundle["product.found"],
          AllProducts: products,
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
  async view_by_categories(request, response) {
    try {
      let categories = request.body.categories;
      if (request.query.rating) {
        rating = request.query.rating;
      } else {
        rating = 0;
      }
      let products = await productOperations.view_by_categories(
        categories,
        rating
      );
      if (products) {
        response.status(SUCCESS).json({
          message: messageBundle["product.found"],
          AllProducts: products,
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
  async view_by_price(request, response) {
    try {
      let gt = request.query.gt;
      let lt = request.query.lt;
      if (request.query.rating) {
        rating = request.query.rating;
      } else {
        rating = 0;
      }
      let products = await productOperations.view_by_price(gt, lt, rating);
      if (products) {
        response.status(SUCCESS).json({
          message: messageBundle["product.found"],
          AllProducts: products,
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
  async view_by_rating(request, response) {
    try {
      let rating = request.query.rating;
      let products = await productOperations.view_by_rating(rating);
      if (products) {
        response.status(SUCCESS).json({
          message: messageBundle["product.found"],
          AllProducts: products,
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
  async view_by_name_category(request, response) {
    try {
      let name = request.query.name;
      let category = request.query.category;
      if (request.query.rating) {
        let rating = request.query.rating;
      } else rating = 0;
      let products = await productOperations.view_by_name_category(
        name,
        category,
        rating
      );
      if (products) {
        response.status(SUCCESS).json({
          message: messageBundle["product.found"],
          AllProducts: products,
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
  async view_by_name_categories(request, response) {
    try {
      let name = request.body.name;
      let categories = request.body.categories;
      if (request.query.rating) {
        let rating = request.query.rating;
      } else rating = 0;
      let products = await productOperations.view_by_name_categories(
        name,
        categories,
        rating
      );
      if (products) {
        response.status(SUCCESS).json({
          message: messageBundle["product.found"],
          AllProducts: products,
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
  async view_by_price_categories(request, response) {
    try {
      let gt = request.query.gt;
      let lt = request.query.lt;
      let categories = request.body.categories;
      let products = await productOperations.view_by_price_categories(
        gt,
        lt,
        categories
      );
      if (products) {
        response.status(SUCCESS).json({
          message: messageBundle["product.found"],
          AllProducts: products,
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
  async edit_review(request, response) {
    try {
      let token = request.headers["authorization"];
      let doc = jwt.getdoc(token);
      let product_id = request.body.product_id;
      let review = request.body.review;
      let check = await productOperations.check_reviewed(
        doc.user_id,
        product_id
      );
      if (check) {
        let update_review = await productOperations.update_review(
          doc.user_id,
          product_id,
          review
        );
        if (update_review.modifiedCount) {
          response
            .status(SUCCESS)
            .json({ message: messageBundle["rating_or_review.successful"] });
        } else {
          response
            .status(SERVER_CRASH)
            .json({ message: messageBundle["unsuccessful"] });
        }
      } else {
        response
          .status(NOT_FOUND)
          .json({ message: messageBundle["rating_or_review.unsuccessful"] });
      }
    } catch (err) {
      response
        .status(SERVER_CRASH)
        .json({ message: messageBundle["unsuccessful"], ERROR: err });
    }
  },
  async view_all_reviews(request, response) {
    try {
      let product_id = request.body.product_id;
      let reviews = await productOperations.view_all_reviews(product_id);
      if (reviews) {
        response
          .status(SUCCESS)
          .json({ message: messageBundle["found"], reviews: reviews });
      } else {
        response
          .status(NOT_FOUND)
          .json({ message: messageBundle["not_found"] });
      }
    } catch (err) {
      response
        .status(SERVER_CRASH)
        .json({ message: messageBundle["unsuccessful"], ERROR: err });
    }
  },
  async search_in_reviews(request, response) {
    try {
      let product_id = request.body.product_id;
      let search = request.body.search;
      let reviews = await productOperations.search_in_reviews(
        product_id,
        search
      );
      if (reviews) {
        response
          .status(SUCCESS)
          .json({ message: messageBundle["found"], reviews: reviews });
      } else {
        response
          .status(NOT_FOUND)
          .json({ message: messageBundle["not_found"] });
      }
    } catch (err) {
      response
        .status(SERVER_CRASH)
        .json({ message: messageBundle["unsuccessful"], ERROR: err });
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
      };
      let product = await productOperations.update_product(
        footwear_id,
        footwearObject
      );
      if (product.modifiedCount && footwearObject) {
        response.status(SUCCESS).json({
          message: messageBundle["update.successful"],
          Product: footwearObject,
        });
        if (product.modifiedCount) {
        } else {
          response
            .status(NOT_FOUND)
            .json({ message: messageBundle["update.unsuccessful"] });
        }
      }
    } catch (err) {
      response
        .status(SERVER_CRASH)
        .json({ message: messageBundle["unsuccessful"], ERROR: err });
    }
  },
  async update_quantity(request, response) {
    try {
      let footwear_id = request.body.footwear_id;
      let pair = request.body.pair;
      let footwear = await productOperations.update_quantity(footwear_id, pair);

      if (footwear.modifiedCount && footwear_id && pair) {
        response
          .status(SUCCESS)
          .json({ message: messageBundle["update.successful"] });
      } else {
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
  async direct_change(request, response) {
    //this was created for adding random discounts to all products
    try {
      let update = await productOperations.direct_change();
      if (update) {
        response
          .status(SUCCESS)
          .json({ message: messageBundle["update.successful"] });
      } else {
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
};
module.exports = productController;
