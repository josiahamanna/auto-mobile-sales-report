/**
 * Sales.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    sales: {
      type: "number"
    },
    car: {
      type: "string"
    },
    city: {
      type: "string"
    }
  }
};
