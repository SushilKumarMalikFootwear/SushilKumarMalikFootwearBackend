const FootwearModel = require("../models/footwear");

module.exports = {
  async applyChanges() {
    // let trader_finances = {};
    // let trader_finances_logs = await TraderFinancesLogs.find();
    // for (const log of trader_finances_logs) {
    //   const traderName = log.trader_name;
    //   if (!trader_finances[traderName]) {
    //     trader_finances[traderName] = {
    //       trader_name: traderName,
    //       total_cost_price: 0,
    //       cost_price_of_sold: 0,
    //       selling_price_of_sold: 0,
    //     };
    //   }
    //   if (log.type === "PURCHASE") {
    //     trader_finances[traderName].total_cost_price += log.amount || 0;
    //   }
    // }
    // console.log(trader_finances);
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
  add_product(footwearObject) {
    // The server owns this date; never accept it from the client.
    delete footwearObject.website_first_shown_at;
    if (footwearObject.show_on_website === true) {
      footwearObject.website_first_shown_at = new Date();
    }
    let promise = FootwearModel.create(footwearObject);
    return promise;
  },
  // Records the first time a product was switched on for the website.
  // Only sets the date if it was never set, so switching off and on again
  // does not make a product "new" again.
  async mark_first_shown_on_website(footwear_id) {
    return FootwearModel.updateOne(
      {
        footwear_id: footwear_id,
        show_on_website: true,
        website_first_shown_at: { $exists: false },
      },
      { $set: { website_first_shown_at: new Date() } }
    );
  },
  async get_all_group_keys() {
    // The website ignores capitals/spaces when grouping, so suggest each key
    // once, using its most common spelling.
    const rows = await FootwearModel.aggregate([
      { $match: { group_key: { $exists: true, $ne: "" } } },
      { $group: { _id: "$group_key", n: { $sum: 1 } } },
    ]);
    const best = new Map();
    for (const { _id: key, n } of rows) {
      const norm = require("./website_catalog").slugify(key);
      const current = best.get(norm);
      if (!current || n > current.n) best.set(norm, { key, n });
    }
    return [...best.values()].map((v) => v.key).sort((a, b) => a.localeCompare(b));
  },
  async get_all_tags() {
    const tags = await FootwearModel.distinct("tags");
    return tags.filter(Boolean).sort((a, b) => a.localeCompare(b));
  },
  async get_all_articles() {
    let articles = FootwearModel.aggregate(
      [
        {
          "$group": {
            "_id": null,
            "uniqueArticles": { "$addToSet": "$article" }
          }
        },
        {
          "$sort": { "article": 1 }
        },
        {
          "$project": { "_id": 0, "uniqueArticles": 1 }
        }
      ]
    );
    return articles;
  },
  async get_all_labels() {
    let labels = FootwearModel.aggregate([
      {
        "$group": {
          "_id": null,
          "uniqueLables": { "$addToSet": "$label" }
        }
      },
      {
        "$sort": { "label": 1 }
      },
      {
        "$project": { "_id": 0, "uniqueLables": 1 }
      }
    ]);
    return labels;
  },
  async view_all_products() {
    try {
      let footwears = await FootwearModel.find({
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
  async filter_footwears(filterObject) {
    try {
      let filterAggregatePipeline = [];
      const filter_by_brand = (brand) => ({
        $match: { brand: { $regex: brand, $options: "i" } }
      });
      const filter_by_category = (category) => ({
        $match: { category: { $regex: category, $options: "i" } }
      });
      const filter_by_article = (article) => ({
        $match: { article: { $regex: article, $options: "i" } }
      });
      const filter_by_size_range = (size_range) => ({
        $match: { size_range: { $regex: size_range, $options: "i" } }
      });
      const filter_by_color = (color) => ({
        $match: { color: { $regex: color, $options: "i" } }
      });
      const filter_by_vendor = (vendor) => ({
        $match: { vendor: { $regex: vendor, $options: "i" } }
      });
      const filter_by_label = (label) => ({
        $match: {
          label: {
            $elemMatch: { $regex: label, $options: "i" }
          }
        }
      });
      for (let key in filterObject) {
        if (filterObject[key] != "") {
          if (key == "brand")
            filterAggregatePipeline.push(filter_by_brand(filterObject[key]));
          else if (key == "category")
            filterAggregatePipeline.push(filter_by_category(filterObject[key]));
          else if (key == "article")
            filterAggregatePipeline.push(filter_by_article(filterObject[key]));
          else if (key == "size_range")
            filterAggregatePipeline.push(filter_by_size_range(filterObject[key]));
          else if (key == "color")
            filterAggregatePipeline.push(filter_by_color(filterObject[key]));
          else if (key == "vendor")
            filterAggregatePipeline.push(filter_by_vendor(filterObject[key]));
          else if (key == "label")
            filterAggregatePipeline.push(filter_by_label(filterObject[key]));
          else if (key == "group_key")
            filterAggregatePipeline.push({ $match: { group_key: filterObject[key] } });
          else if (key == "show_on_website") {
            const on = filterObject[key] === true || filterObject[key] === "true";
            // Products created before this field existed count as "off".
            filterAggregatePipeline.push({
              $match: on ? { show_on_website: true } : { show_on_website: { $ne: true } },
            });
          }
        }
      }
      if (filterObject.rating_more_than || filterObject.rating_less_than) {
        let ratingMatch = {};
        if (filterObject.rating_more_than) {
          ratingMatch.$gte = Number(filterObject.rating_more_than);
        }
        if (filterObject.rating_less_than) {
          ratingMatch.$lte = Number(filterObject.rating_less_than);
        }
        filterAggregatePipeline.push({
          $match: { rating: ratingMatch }
        });
      }
      if (filterObject['out_of_stock'] !== null && filterObject['out_of_stock'] !== undefined) {
        filterAggregatePipeline.push({
          $match: { out_of_stock: filterObject['out_of_stock'] == "true" }
        });
      }
      filterAggregatePipeline.push({ $sort: { _id: -1 } });
      const page = parseInt(filterObject.page) > 0 ? parseInt(filterObject.page) : 1;
      const limit = parseInt(filterObject.limit) > 0 ? parseInt(filterObject.limit) : 50;
      const skip = (page - 1) * limit;
      filterAggregatePipeline.push({ $skip: skip });
      filterAggregatePipeline.push({ $limit: limit });
      let footwears = await FootwearModel.aggregate(filterAggregatePipeline);
      const totalCount = await FootwearModel.aggregate([
        ...filterAggregatePipeline.filter(stage =>
          !stage.$skip && !stage.$limit && !stage.$sort
        ),
        { $count: "count" }
      ]);

      return footwears;
    } catch (err) {
      console.log("ERROR is : ", err);
      return null;
    }
  },
  async view_by_product_id(footwear_id) {
    try {
      let footwear = await FootwearModel.find({ footwear_id: footwear_id });
      return footwear;
    } catch (err) {
      console.log("ERROR is : ", err);
    }
  },
  // `websiteUpdate` ({ $set, $unset } from utils/website_fields) is optional:
  // stock updates from invoices don't pass it, so website fields stay as they are.
  async update_product(footwear_id, footwearObject, websiteUpdate) {
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
      const extraSet = (websiteUpdate && websiteUpdate.$set) || {};
      const extraUnset = (websiteUpdate && websiteUpdate.$unset) || {};
      let update = await FootwearModel.updateOne(
        {
          footwear_id: footwear_id,
        },
        {
          ...(Object.keys(extraUnset).length ? { $unset: extraUnset } : {}),
          $set: {
            ...extraSet,
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
            // images: footwearObject.images,
            vendor: footwearObject.vendor,
            out_of_stock: out_of_stock,
            label: footwearObject.label,
            rating: footwearObject.rating,
            updated: footwearObject.updated,
            size_description: footwearObject.size_description,
            new_images: footwearObject.new_images
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
};
