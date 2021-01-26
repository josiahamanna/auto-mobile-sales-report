/**
 * SalesData.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    serialNo: {
      type: "number"
    },
    date: {
      type: "ref",
      columnType: "date"
    },
    city: {
      type: "string"
    },
    car: {
      type: "string"
    },
    color: {
      type: "string"
    },
    numberOfVehiclesSold: {
      type: "number"
    },
    totalPrice: {
      type: "number"
    },
    price: {
      type: "number"
    },
    company: {
      type: "string"
    }
  }
};
