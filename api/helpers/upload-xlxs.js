const { excelDateToJSDate } = require("../utils/excel-date-to-js-date.js");

module.exports = {
  friendlyName: "Upload xlxs",

  description: "",

  inputs: {
    fd: {
      type: "string"
    }
  },

  exits: {
    success: {
      description: "All done."
    }
  },

  fn: async function (inputs) {
    const filePath = inputs.fd;
    const readXlsxFile = require("read-excel-file/node");
    const importSalesData = readXlsxFile(filePath, {
      sheet: 2,
      dateFormat: "MM/DD/YY"
    }).then(async (rows) => {
      for (let i = 2; i < rows.length; i++) {
        let salesCol, salesRow, totalPrice;
        const importSales = await readXlsxFile(filePath, { sheet: 3 }).then(
          async (rowSales) => {
            for (let carCol = 1; carCol < rowSales[1].length; carCol++) {
              if (rowSales[1][carCol] == rows[i][3]) {
                salesCol = carCol;
                break;
              }
            }
            for (let cityRow = 0; cityRow < rowSales.length; cityRow++) {
              if (rowSales[cityRow][0] == rows[i][2]) {
                salesRow = cityRow;
                break;
              }
            }
            const importCars = await readXlsxFile(filePath, { sheet: 4 }).then(
              async (companyCarRow) => {
                let company;
                for (
                  let vehicle = 2;
                  vehicle < companyCarRow.length;
                  vehicle++
                ) {
                  if (companyCarRow[vehicle][1] == rows[i][3])
                    company = companyCarRow[vehicle][0].split(" ").join("-");
                }
                const price = rowSales[salesRow][salesCol];
                totalPrice = price * rows[i][5];
                await SalesData.create({
                  serialNo: rows[i][0],
                  date: excelDateToJSDate(rows[i][1]),
                  city: rows[i][2].trim(),
                  car: rows[i][3].trim(),
                  color: rows[i][4].trim(),
                  numberOfVehiclesSold: rows[i][5],
                  totalPrice,
                  price,
                  company
                });
              }
            );
          }
        );
      }
    });
    const importSales = readXlsxFile(filePath, { sheet: 3 }).then(
      async (rows) => {
        for (let i = 2; i < rows.length; i++) {
          for (let j = 1; j < rows[i].length; j++) {
            await Sales.create({
              sales: rows[i][j],
              car: rows[1][j].trim(),
              city: rows[i][0].trim()
            });
          }
        }
      }
    );
    const importCars = readXlsxFile(filePath, { sheet: 4 }).then(
      async (rows) => {
        for (let i = 2; i < rows.length; i++) {
          await Cars.create({
            company: rows[i][0].trim(),
            car: rows[i][1].trim()
          });
        }
      }
    );
    const importZones = readXlsxFile(filePath, { sheet: 5 }).then(
      async (rows) => {
        for (let i = 2; i < rows.length; i++) {
          await Zones.create({
            zone: rows[i][1].trim(),
            city: rows[i][0].trim()
          });
        }
      }
    );
    return true;
  }
};
