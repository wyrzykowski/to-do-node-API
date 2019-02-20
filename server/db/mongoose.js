var mongoose = require("mongoose");

//mongoode działa defoultowo na callbackach, ale tu będzie pokazane na promisach:
//Ustawiam dla mongoose'a jakiej biblioteki do promisów będe uzywał:
mongoose.Promise = global.Promise;
mongoose.connect(
  "mongodb://karol2tomek:haslotestowe@cluster0-shard-00-00-royto.mongodb.net:27017,cluster0-shard-00-01-royto.mongodb.net:27017,cluster0-shard-00-02-royto.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true"
);

module.exports = {
  mongoose
};
