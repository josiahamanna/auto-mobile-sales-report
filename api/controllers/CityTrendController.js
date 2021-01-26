/**
 * CityTrendController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

// Helper hash
const { monthIntToString } = require("../../constants/MonthHash.js");

module.exports = {
  cityWiseTrend: async (req, res) => {
    const company = req.query.company;
    const db = SalesData.getDatastore().manager;
    const monthWiseIds = await db
      .collection("salesdata")
      .aggregate([
        {
          $match: {
            company
          }
        },
        {
          $group: {
            _id: { $substr: ["$date", 5, 2] },
            ids: {
              $push: "$_id"
            }
          }
        }
      ])
      .toArray();
    const monthWiseIdsHash = monthWiseIds.reduce((acc, item) => {
      acc[item._id] = item.ids.map((item) => item.toString());
      return acc;
    }, {});

    const cityWiseSalesList = await Promise.all(
      Object.keys(monthWiseIdsHash).map(async (month) => {
        const locationWiseTotalSales = {};
        for (let i = 0; i < monthWiseIdsHash[month].length; i++) {
          const salesData = await SalesData.find({
            id: monthWiseIdsHash[month][i]
          });
          if (locationWiseTotalSales[salesData[0].city]) {
            locationWiseTotalSales[salesData[0].city] +=
              salesData[0].numberOfVehiclesSold;
          } else {
            locationWiseTotalSales[salesData[0].city] =
              salesData[0].numberOfVehiclesSold;
          }
        }
        return { month: monthIntToString[month], locationWiseTotalSales };
      })
    );
    if (cityWiseSalesList.length) {
      res.ok({ status: 200, data: cityWiseSalesList });
    } else {
      res.ok({ status: 200, msg: "No records found" });
    }
  }
};
