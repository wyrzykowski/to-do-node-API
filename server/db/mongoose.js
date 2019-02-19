var mongoose = require("mongoose");

//mongoode działa defoultowo na callbackach, ale tu będzie pokazane na promisach:
//Ustawiam dla mongoose'a jakiej biblioteki do promisów będe uzywał:
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/TodoApp");

module.exports = {
  mongoose
};
