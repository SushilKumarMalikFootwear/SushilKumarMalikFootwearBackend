const FootwearModel = require("../models/footwear");
var ObjectId = require("mongoose").Types.ObjectId;
module.exports = {
  add_product(footwearObject) {
    // let start_size = parseInt(footwearObject.size_range.split(" ")[0].split("X")[0]);
    // let end_size = parseInt(footwearObject.size_range.split(" ")[0].split("X")[1]);
    // let pair = footwearObject.pairs_in_stock[0];
    // for (let i = start_size; i <= end_size; i++) {
    //   if (pair.size != i || pair.available_at != "HOME") {
    //     footwearObject.pairs_in_stock.push({
    //       size: i,
    //       available_at: "HOME",
    //       quantity: 0,
    //     });
    //   }
    //   if (pair.size != i || pair.available_at != "SHOP") {
    //     footwearObject.pairs_in_stock.push({
    //       size: i,
    //       available_at: "SHOP",
    //       quantity: 0,
    //     });
    //   }
    // }
    let promise = FootwearModel.create(footwearObject);
    return promise;
  },
  view_all_products() {
    try {
      let footwears = FootwearModel.find();
      if (footwears.length != 0) {
        return footwears;
      } else {
        return null;
      }
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async view_45_products(skip, limit, rating) {
    try {
      /*let products =await FootwearModel.find(
                {
                    "product_rating":{
                        $gte:rating
                    }
                },
                {
                    "_id":0,
                    "product_id":1,
                    "product_name":1,
                    "product_img":1,
                    "product_price":1
                }
            ).skip(start).limit(start+45);*/
      let products = await FootwearModel.aggregate([
        {
          $match: {
            product_rating: {
              $gte: rating,
            },
          },
        },
        {
          $project: {
            _id: 0,
            product_id: 1,
            product_name: 1,
            product_img: 1,
            product_price: 1,
            discount: 1,
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ]);
      let total_products = await FootwearModel.find().count();
      if (products.length != 0) {
        return { products, total_products };
      } else {
        return null;
      }
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async find_by_interest(interested_in, rating) {
    try {
      let products = await FootwearModel.find(
        {
          product_category: {
            $in: interested_in,
          },
          product_rating: {
            $gte: rating,
          },
        },
        {
          _id: 0,
          product_id: 1,
          product_name: 1,
          product_img: 1,
          product_price: 1,
          discount: 1,
        }
      );
      if (products.length != 0) {
        return products;
      } else {
        return null;
      }
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async view_by_name(name) {
    try {
      let products = await FootwearModel.find(
        {
          product_name: new RegExp(".*" + name + ".*", "i"),
          product_rating: {
            $gte: rating,
          },
        },
        {
          _id: 0,
          product_id: 1,
          product_name: 1,
          product_img: 1,
          product_price: 1,
          discount: 1,
        }
      );
      if (products.length != 0) {
        return products;
      } else {
        return null;
      }
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async view_by_category(category, rating) {
    //by find()
    try {
      let products = await FootwearModel.find(
        {
          product_category: category,
          product_rating: {
            $gte: rating,
          },
        },
        {
          _id: 0,
          product_id: 1,
          product_name: 1,
          product_img: 1,
          product_price: 1,
          discount: 1,
        }
      );
      if (products.length != 0) {
        return products;
      } else {
        return null;
      }
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async view_by_categories(categories, rating) {
    //by find()
    try {
      let products = await FootwearModel.find(
        {
          product_category: {
            $in: categories,
          },
          product_rating: {
            $gte: rating,
          },
        },
        {
          _id: 0,
          product_id: 1,
          product_name: 1,
          product_img: 1,
          product_price: 1,
          discount: 1,
        }
      );
      if (products.length != 0) {
        return products;
      } else {
        return null;
      }
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async view_by_price(gt, lt, rating) {
    //by comaprision from x to y price
    try {
      let products = await FootwearModel.find(
        {
          $and: [
            {
              product_price: { $gt: gt },
            },
            {
              product_price: { $lt: lt },
            },
          ],
          product_rating: { $gte: rating },
        },
        {
          _id: 0,
          product_id: 1,
          product_name: 1,
          product_img: 1,
          product_price: 1,
          discount: 1,
        }
      );
      if (products.length != 0) {
        return products;
      } else {
        return null;
      }
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async view_by_rating(rating) {
    //by find()
    try {
      let products = await FootwearModel.find(
        {
          product_rating: {
            $gte: rating,
          },
        },
        {
          _id: 0,
          product_id: 1,
          product_name: 1,
          product_img: 1,
          product_price: 1,
          discount: 1,
        }
      );
      if (products.length != 0) {
        return products;
      } else {
        return null;
      }
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async view_by_name_category(name, category, rating) {
    try {
      let products = await FootwearModel.find(
        {
          product_category: category,
          product_name: new RegExp(".*" + name + ".*", "i"),
          product_rating: {
            $gte: rating,
          },
        },
        {
          _id: 0,
          product_id: 1,
          product_name: 1,
          product_img: 1,
          product_price: 1,
          discount: 1,
        }
      );
      if (products.length != 0) {
        return products;
      } else {
        return null;
      }
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async view_by_price_categories(gt, lt, categories) {
    try {
      let products = await FootwearModel.find(
        {
          product_category: {
            $in: categories,
          },
          $and: [
            {
              product_price: { $gt: gt },
            },
            {
              product_price: { $lt: lt },
            },
          ],
        },
        {
          _id: 0,
          product_id: 1,
          product_name: 1,
          product_img: 1,
          product_price: 1,
          discount: 1,
        }
      );
      if (products.length != 0) {
        return products;
      } else {
        return null;
      }
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async view_by_product_id(footwear_id) {
    try {
      let footwear = await FootwearModel.findById(footwear_id);
      if (footwear) {
        return footwear;
      } else {
        return null;
      }
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async view_by_name_categories(name, categories, rating) {
    try {
      let products = await FootwearModel.find(
        {
          product_category: {
            $in: categories,
          },
          product_name: new RegExp(".*" + name + ".*", "i"),
          product_rating: {
            $gte: rating,
          },
        },
        {
          _id: 0,
          product_id: 1,
          product_name: 1,
          product_img: 1,
          product_price: 1,
          discount: 1,
        }
      );
      if (products.length != 0) {
        return products;
      } else {
        return null;
      }
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async update_rating(product_id, rating, rated_by) {
    try {
      let update = await FootwearModel.updateOne(
        {
          product_id: product_id,
        },
        {
          $set: {
            product_rating: rating,
            rated_by: rated_by,
          },
        }
      );
      return update;
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async check_reviewed(user_id, product_id) {
    try {
      let check = await FootwearModel.findOne(
        {
          product_id: product_id,
          "product.reviews.user_id": user_id,
        },
        {
          _id: 1,
        }
      );
      if (check) {
        return check;
      } else {
        return null;
      }
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async add_review(product_id, review) {
    try {
      let update = await FootwearModel.updateOne(
        {
          product_id: product_id,
        },
        {
          $push: {
            reviews: review,
          },
        }
      );
      return update;
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async update_review(user_id, product_id, review) {
    try {
      let update_review = await FootwearModel.updateOne(
        {
          product_id: product_id,
          "reviews.user_id": user_id,
        },
        {
          $set: {
            "reviews.$.review": review,
          },
        }
      );
      return update_review;
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async view_all_reviews(product_id) {
    try {
      let reviews = await FootwearModel.aggregate([
        {
          $match: {
            product_id: product_id,
          },
        },
        {
          $unwind: "$reviews",
        },
        {
          $lookup: {
            from: "users",
            localField: "reviews.user_id",
            foreignField: "user_id",
            as: "user",
          },
        },
        {
          $project: {
            _id: 0,
            "user.name": 1,
            reviews: 1,
          },
        },
      ]);
      if (reviews.length != 0) {
        return reviews;
      } else {
        return null;
      }
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async search_in_reviews(product_id, search) {
    try {
      let reviews = await FootwearModel.aggregate([
        {
          $unwind: "$reviews",
        },
        {
          $match: {
            product_id: product_id,
            "reviews.review": new RegExp(search, "i"),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "reviews.user_id",
            foreignField: "user_id",
            as: "user",
          },
        },
        {
          $project: {
            _id: 0,
            "user.name": 1,
            "reviews.review": 1,
          },
        },
      ]);
      if (reviews.length != 0) {
        return reviews;
      } else {
        return null;
      }
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async update_product(footwear_id, footwearObject) {
    try {
      let update = await FootwearModel.updateOne(
        {
          footwear_id: footwear_id,
        },
        {
          $set: {
            brand:footwearObject.brand,
            sub_brand:footwearObject.sub_brand,
            article:footwearObject.article,
            mrp:footwearObject.mrp,
            selling_price:footwearObject.selling_price,
            cost_price:footwearObject.cost_price,
            category:footwearObject.category,
            color:footwearObject.color,
            pairs_in_stock:footwearObject.pairs_in_stock,
            size_range:footwearObject.size_range,
            description:footwearObject.description,
            images:footwearObject.images
          },
        }
      );
      return update;
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async change_quantity(p_id, p_qty) {
    try {
      let find = await FootwearModel.findOne({ product_id: p_id });
      console.log(find);
      if (find.product_qty >= p_qty) {
        let update = await FootwearModel.updateOne(
          {
            product_id: p_id,
          },
          {
            $inc: {
              product_qty: -p_qty,
            },
          }
        );
        return update;
      } else {
        return null;
      }
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async update_quantity(footwear_id, pair) {
    try {
      let footwear = await FootwearModel.findById(footwear_id);
      // let pair_present = false;
      // footwear.pairs_in_stock.forEach((pair_in_stock) => {
      //   if (
      //     pair.size == pair_in_stock.size &&
      //     pair.available_at == pair_in_stock.available_at
      //   ) {
      //     pair_present = true;
      //   }
      // });
      // console.log(pair_present);
      let update = await FootwearModel.updateOne(
        {
          _id: footwear_id,
          pairs_in_stock: {
            $elemMatch: {
              size: pair.size,
              available_at: pair.available_at,
            },
          },
        },
        {
          $inc: {
            "pairs_in_stock.$.quantity": pair.quantity,
          },
        }
      );
      return update;
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async delete_product(p_id) {
    try {
      let deleted = await FootwearModel.deleteOne({
        product_id: p_id,
      });
      return deleted;
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async direct_change() {
    //will add or update discount randomly
    try {
      console.log("reached");
      let err = 0;
      let products = await FootwearModel.find();
      for (let i = 0; i < products.length; i++) {
        let discount = Math.floor(Math.random() * 20);
        let update = await FootwearModel.updateOne(
          {
            product_id: products[i].product_id,
          },
          {
            $set: {
              discount: discount,
            },
          }
        );
        if (update.modifiedCount) {
          console.log(update.modifiedCount);
          err = 0;
        } else {
          err = 1;
        }
      }
      if (err == 0) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
};
