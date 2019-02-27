var env = process.env.NODE_ENV; // ta zmienna środowiskowa dostępna tylko na heroku

if (env === "development" || env === "test") {
  var config = require("./config.json");
  var envConfig = config[env]; //grap proper env configuration from config.json

  Object.keys(envConfig).forEach(key => {
    //Object.keys return keys from argument
    process.env[key] = envConfig[key];
  });
}

// if (env === "development") {
//   process.env.PORT = 3000;
//   process.env.MONGODB_URI = "mongodb://localhost:27017/TodoApp";
// } else if (env === "test") {
//   process.env.PORT = 3000;
//   process.env.MONGODB_URI = "mongodb://localhost:27017/TodoApptest";
// } else {
//   process.env.MONGODB_URI =
//     "mongodb://" +
//     process.env.todoapp_db +
//     "@cluster0-shard-00-00-royto.mongodb.net:27017,cluster0-shard-00-01-royto.mongodb.net:27017,cluster0-shard-00-02-royto.mongodb.net:27017/ToooApp?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true";
// }
