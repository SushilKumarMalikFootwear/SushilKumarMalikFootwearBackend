const FootwearModel = require("../models/footwear");
const InvoiceModel = require("../models/invoice");
const TraderFinances = require("../models/tarder_finances");
module.exports = {
  add_product(footwearObject) {
    let promise = FootwearModel.create(footwearObject);
    return promise;
  },
  async get_all_articles(){
    let articles = FootwearModel.aggregate(
      [
        {
          "$group": {
            "_id": null,
            "uniqueArticles": {"$addToSet": "$article"}
          }
        },
        {
          "$sort": {"article": 1}
        },
        {
          "$project": {"_id": 0, "uniqueArticles": 1}
        }
      ]
    );
    return articles;
  },
  async applyChanges() {
    // code for finging correct trader finances
    // let trader_finances = {
    //   "Baba Footwear": {
    //     total_cost_price: 227311,
    //     cost_price_of_sold: 0,
    //     selling_price_of_sold: 0,
    //   },
    //   "Gupta Footwear": {
    //     total_cost_price: 381212,
    //     cost_price_of_sold: 0,
    //     selling_price_of_sold: 0,
    //   },
    //   "R.S. Trading": {
    //     total_cost_price: 395587,
    //     cost_price_of_sold: 0,
    //     selling_price_of_sold: 0,
    //   },
    //   "Raj Traders": {
    //     total_cost_price: 247311,
    //     cost_price_of_sold: 0,
    //     selling_price_of_sold: 0,
    //   },
    //   "S. Kumar": {
    //     total_cost_price: 134725,
    //     cost_price_of_sold: 0,
    //     selling_price_of_sold: 0,
    //   },
    //   "Relaxo Delhi": {
    //     total_cost_price: 5302,
    //     cost_price_of_sold: 0,
    //     selling_price_of_sold: 0,
    //   },
    //   "S. Kumar Neighbour": {
    //     total_cost_price: 1360,
    //     cost_price_of_sold: 0,
    //     selling_price_of_sold: 0,
    //   },
    //   "J.K. Enterprise": {
    //     total_cost_price: 60874,
    //     cost_price_of_sold: 0,
    //     selling_price_of_sold: 0,
    //   },
    //   "JHA HOSIERY": {
    //     total_cost_price: 1900,
    //     cost_price_of_sold: 0,
    //     selling_price_of_sold: 0,
    //   },
    //   "Rivaldo Sports": {
    //     total_cost_price: 41230,
    //     cost_price_of_sold: 0,
    //     selling_price_of_sold: 0,
    //   },
    //   "Sapraa Footwear": {
    //     total_cost_price: 75844,
    //     cost_price_of_sold: 0,
    //     selling_price_of_sold: 0,
    //   },
    //   "Milap Agencies": {
    //     total_cost_price: 8195,
    //     cost_price_of_sold: 0,
    //     selling_price_of_sold: 0,
    //   },
    //   "Amir Footwear": {
    //     total_cost_price: 14230,
    //     cost_price_of_sold: 0,
    //     selling_price_of_sold: 0,
    //   },
    //   "Karol Bagh Vendors": {
    //     total_cost_price: 930,
    //     cost_price_of_sold: 0,
    //     selling_price_of_sold: 0,
    //   }
    // };
    // // let update = await InvoiceModel.updateMany(
    // //   {},
    // //   { $set: { pending_amount: 0.0 } }
    // // );
    // // console.log(update);
    // // update = await FootwearModel.updateMany({}, { $set: { rating: 0.0 } });
    // let invoices = await InvoiceModel.find();
    // for (let i = 0; i < invoices.length; i++) {
    //   let invoice = invoices[i];
    //   if (invoice.invoice_status != "RETURNED") {
    //     let trader = trader_finances[invoice.vendor];
    //     trader["cost_price_of_sold"] += invoice.cost_price;
    //     trader["selling_price_of_sold"] += invoice.selling_price;
    //     if (invoice.add_in_total_cost) {
    //       trader["total_cost_price"] += invoice.cost_price;
    //     }

    //   }
    // }
    // console.log(trader_finances);
    // for (const traderName in trader_finances) {
    //   if (trader_finances.hasOwnProperty(traderName)) {
    //     const update = await TraderFinances.updateOne(
    //       { trader_name: traderName },
    //       {
    //         $set: {
    //           total_cost_price: trader_finances[traderName].total_cost_price,
    //           cost_price_of_sold: trader_finances[traderName].cost_price_of_sold,
    //           selling_price_of_sold: trader_finances[traderName].selling_price_of_sold,
    //         },
    //       }
    //     );
    //     console.log(`Updated ${traderName}:`, update);
    //   }
    // }

    // code to find -ve pairs in stock
    // let products = await FootwearModel.find();
    // for(let i = 0; i< products.length; i++){
    //   let product = products[i];
    //   for(let j=0; j<product.pairs_in_stock.length; j++){
    //     let pair = product.pairs_in_stock[j];
    //     if(pair['quantity']<0){
    //       console.log(product.article+ product.color);
    //     }
    //   }
    // }

    // const startOfDay = new Date('2024-12-15T00:00:00Z'); // Start of the day (UTC)
    // const endOfDay = new Date('2024-12-15T23:59:59.999Z'); // End of the day (UTC)

    // let inv1 = await InvoiceModel.find({
    //   invoice_date: { $gte: startOfDay, $lte: endOfDay }, // createdAt within 14-12-2024
    // })

    // let inv2 = await InvoiceModel.find({createdAt: { $gte: startOfDay, $lte: endOfDay }});

    // for(let i = 0; i < 47; i++){
    //   if(inv1[i].article!=inv2[i].article){
    //     console.log( "1 - "+inv1[i].article);
    //     console.log("2 - "+inv2[i].article)
    //   }
    // }
  },
  async view_all_products(out_of_stock) {
    try {
      let footwears = await FootwearModel.find({
        out_of_stock: out_of_stock,
      }).sort({ _id: -1 });
      if (footwears.length != 0) {
        return footwears;
      } else {
        return null;
      }
    } catch (err) {
      console.log("ERROR is : ", err);
      return null;
    }
  },
  async filter_footwears(filterObject, out_of_stock) {
    try {
      let filterAggregatePipeline = [];
      let filter_by_brand = (brand) => {
        return {
          $match: { brand: { $regex: brand, $options: "i" } },
        };
      };
      let filter_by_category = (category) => {
        return {
          $match: { category: { $regex: category, $options: "i" } },
        };
      };
      let filter_by_article = (article) => {
        return {
          $match: { article: { $regex: article, $options: "i" } },
        };
      };
      let filter_by_size_range = (size_range) => {
        return {
          $match: { size_range: { $regex: size_range, $options: "i" } },
        };
      };
      let filter_by_color = (color) => {
        return {
          $match: { color: { $regex: color, $options: "i" } },
        };
      };
      let filter_by_vendor = (vendor) => {
        return {
          $match: { vendor: { $regex: vendor, $options: "i" } },
        };
      };
      for (key in filterObject) {
        if (filterObject[key] != "") {
          if (key == "brand") {
            filterAggregatePipeline.push(filter_by_brand(filterObject[key]));
          } else if (key == "category") {
            filterAggregatePipeline.push(filter_by_category(filterObject[key]));
          } else if (key == "article") {
            filterAggregatePipeline.push(filter_by_article(filterObject[key]));
          } else if (key == "size_range") {
            filterAggregatePipeline.push(
              filter_by_size_range(filterObject[key])
            );
          } else if (key == "color") {
            filterAggregatePipeline.push(filter_by_color(filterObject[key]));
          } else if (key == "vendor") {
            filterAggregatePipeline.push(filter_by_vendor(filterObject[key]));
          }
        }
      }
      if (out_of_stock != null || out_of_stock != undefined) {
        filterAggregatePipeline.push({
          $match: { out_of_stock: out_of_stock == "true" },
        });
      }
      let footwears =
        filterAggregatePipeline.length == 0
          ? await FootwearModel.find().sort({ _id: -1 })
          : await FootwearModel.aggregate(filterAggregatePipeline);
      if (footwears.length != 0) {
        return footwears;
      } else {
        return [];
      }
    } catch (err) {
      console.log("ERROR is : ", err);
      return null;
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
  async view_by_id(footwear_id) {
    try {
      let footwear = await FootwearModel.findOne({ footwear_id: footwear_id });
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
      let out_of_stock = true;
      let arr = [...footwearObject.pairs_in_stock];
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].quantity > 0) {
          out_of_stock = false;
        }
      }
      if (footwearObject.description) {
        out_of_stock = false;
      }
      let update = await FootwearModel.updateOne(
        {
          footwear_id: footwear_id,
        },
        {
          $set: {
            brand: footwearObject.brand,
            sub_brand: footwearObject.sub_brand,
            article: footwearObject.article,
            mrp: footwearObject.mrp,
            selling_price: footwearObject.selling_price,
            cost_price: footwearObject.cost_price,
            category: footwearObject.category,
            color: footwearObject.color,
            pairs_in_stock: footwearObject.pairs_in_stock,
            size_range: footwearObject.size_range,
            description: footwearObject.description,
            images: footwearObject.images,
            vendor: footwearObject.vendor,
            out_of_stock: out_of_stock,
            label: footwearObject.label,
            rating: footwearObject.rating,
            updated: footwearObject.updated,
            size_description: footwearObject.size_description
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
        footwear_id: p_id,
      });
      return deleted;
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  async direct_change() {
    try {
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
