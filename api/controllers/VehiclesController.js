/**
 * VehiclesController
 *
 * @description :: Actions for total number of vehicles for given constraints.
 */

// helper function
function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

module.exports = {
  totalCars: async (req, res) => {
    try {
      // Fetch zones and colors from query parameter and split them to array
      const zoneList = req.query.zones.split(",").map((zone) => "Zone " + zone);
      const colorList = req.query.colors.split(",");

      const cities = await Zones.find({
        where: { zone: zoneList },
        select: ["city"]
      });

      const cityList = cities.map((city) => city.city);

      const sold = await SalesData.sum("numberOfVehiclesSold").where({
        city: cityList,
        color: colorList
      });

      console.log("cities", cityList);
      console.log("Number of vehicles", sold);

      res.ok({
        cities: cityList,
        numberOfVehiclesSold: sold
      });
    } catch (error) {
      console.log(error);
      res.serverError({
        status: 500,
        msg: "Please check query parameters",
        error
      });
    }
  },

  aboveAverageSaleValue: async (req, res) => {
    try {
      const db = SalesData.getDatastore().manager;

      const averageSaleValueList = await db
        .collection("salesdata")
        .aggregate([
          {
            $group: {
              _id: "$car",
              totalPriceSum: { $sum: "$totalPrice" },
              totalCars: { $sum: "$numberOfVehiclesSold" }
            }
          },
          {
            $project: {
              averageSaleValue: {
                $divide: ["$totalPriceSum", "$totalCars"]
              }
            }
          }
        ])
        .toArray();
      const averageSaleValueHash = averageSaleValueList.reduce((acc, item) => {
        acc[item._id] = item.averageSaleValue;
        return acc;
      }, {});

      const salesCityList = await db
        .collection("salesdata")
        .aggregate([
          {
            $group: {
              _id: "$car",
              cities: { $push: "$city" }
            }
          }
        ])
        .toArray();
      const salesCityHash = salesCityList.reduce((acc, item) => {
        acc[item._id] = item.cities.filter(onlyUnique);
        return acc;
      }, {});

      const aboveAverageSaleValueCitiesList = await Promise.all(
        Object.keys(salesCityHash).map(async (car) => {
          const mapedCites = await Sales.find({
            where: {
              car,
              city: {
                in: salesCityHash[car]
              },
              sales: { ">": averageSaleValueHash[car] }
            },
            select: "city"
          });
          return {
            car,
            cities: mapedCites.reduce((acc, item) => {
              acc.push(item.city);
              return acc;
            }, [])
          };
        })
      );
      const aboveAverageSaleValueCitiesHash = aboveAverageSaleValueCitiesList.reduce(
        (acc, item) => {
          if (item.cities.length) acc[item.car] = item.cities;
          return acc;
        },
        {}
      );

      const aboveAverageSaleValueVehiclesList = await Promise.all(
        Object.keys(aboveAverageSaleValueCitiesHash).map(async (car) => {
          const mapedVehicles = await db
            .collection("salesdata")
            .aggregate([
              {
                $match: {
                  city: { $in: aboveAverageSaleValueCitiesHash[car] },
                  car
                }
              },
              {
                $group: {
                  _id: "$car",
                  total: {
                    $sum: "$numberOfVehiclesSold"
                  }
                }
              }
            ])
            .toArray();
          return {
            vehicle: car,
            aboveAverageSaleCount: mapedVehicles[0].total
          };
        })
      );
      const data = aboveAverageSaleValueVehiclesList.map((item) => {
        return {
          ...item,
          averageSaleValue: averageSaleValueHash[item.vehicle].toFixed(2)
        };
      });

      console.log("Above average sale value vehicle list", data);

      if (data.length) {
        res.ok({
          status: 200,
          data
        });
      } else {
        res.ok({ msg: "No records found" });
      }
    } catch (error) {
      console.log(error);
      res.serverError({ status: 500, msg: "Internal server error", error });
    }
  }
};
