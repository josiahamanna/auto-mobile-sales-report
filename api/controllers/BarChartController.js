/**
 * BarChartController
 *
 * @description :: Actions for month wise bar graph data
 */

// Helper hash
const { monthIntToString } = require("../../constants/MonthHash.js");

module.exports = {
  monthwiseBargraph: async (req, res) => {
    try {
      const color = req.query.color;

      const db = SalesData.getDatastore().manager;
      const monthTotalSales = await db
        .collection("salesdata")
        .aggregate([
          {
            $match: {
              color
            }
          },
          {
            $group: {
              _id: { $substr: ["$date", 5, 2] },
              totalVehicles: { $sum: "$numberOfVehiclesSold" },
              totalPriceSum: {
                $sum: "$totalPrice"
              }
            }
          }
        ])
        .toArray();
      const monthAverageSaleValue = monthTotalSales.reduce((acc, item) => {
        acc[item._id] = item.totalPriceSum / item.totalVehicles;
        return acc;
      }, {});

      const monthSales = await db
        .collection("salesdata")
        .aggregate([
          {
            $match: {
              color
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
      const monthSalesIds = monthSales.reduce((acc, item) => {
        acc[item._id] = item.ids.map((item) => item.toString());
        return acc;
      }, {});

      const monthSalesAboveAverage = await Promise.all(
        Object.keys(monthSalesIds).map(async (month) => {
          const aboveAverageVehilceCount = await SalesData.sum(
            "numberOfVehiclesSold"
          ).where({
            id: { in: monthSalesIds[month] },
            price: { ">": monthAverageSaleValue[month] }
          });
          return { month: monthIntToString[month], aboveAverageVehilceCount };
        })
      );
      const monthSalesAboveAverageHash = monthSalesAboveAverage.reduce(
        (acc, item) => {
          acc[item.month] = {
            monthSalesAboveAverage: item.aboveAverageVehilceCount
          };
          return acc;
        },
        {}
      );

      console.log("Month wise sales above average", monthSalesAboveAverage);

      if (monthSalesAboveAverage.length) {
        res.ok({ status: 200, data: monthSalesAboveAverageHash });
      } else {
        res.ok({ status: 200, msg: "No records found" });
      }
    } catch (error) {
      console.log(error);
      res.serverError({ status: 500, msg: "Internal server error", error });
    }
  }
};
