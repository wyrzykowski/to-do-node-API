var env = process.env.NODE_ENV; // ta zmienna środowiskowa dostępna tylko na heroku

console.log("#@@@@@@@@#@#@##@#@#@#@#@#@#", env);
if (env === "development") {
  process.env.PORT = 3000;
  process.env.MONGODB_URI = "mongodb://localhost:27017/TodoApp";
} else if (env === "test") {
  process.env.PORT = 3000;
  process.env.MONGODB_URI = "mongodb://localhost:27017/TodoApptest";
} else {
  process.env.MONGODB_URI =
    "mongodb://" +
    process.env.todoapp_db +
    "@cluster0-shard-00-00-royto.mongodb.net:27017,cluster0-shard-00-01-royto.mongodb.net:27017,cluster0-shard-00-02-royto.mongodb.net:27017/ToooApp?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true";
}

const _ = require("lodash");
const express = require("express");
const bodyParser = require("body-parser");
const { ObjectID } = require("mongodb");

var { mongoose } = require("./db/mongoose.js");
var { Todo } = require("./models/todo");
var { Users } = require("./models/user");

var app = express();
const port = process.env.PORT;

app.use(bodyParser.json()); // set podsy parser to be use by express app
//dzięki temu moge wysyłać coś w postaci JSONA do tej aplikacji, bo będzie mi
//od razu parsował JSONA na obiekt JS, jak tego nie zparsuje to dostane w req.body = undefined
app.post("/todos", (req, res) => {
  var todo = new Todo({
    text: req.body.text
  });

  todo.save().then(
    doc => {
      res.send(doc);
    },
    e => {
      res.status(400).send(e); //status(400) wysyła status, że coś posżło nie tak do strony
    }
  );
});

app.get("/todos", (req, res) => {
  Todo.find().then(
    todos => {
      res.send({ todos });
    },
    e => {
      res.status(400).send(e);
    }
  );
});
//Geting document by request from database by Id
app.get("/todos/:id", (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    res.status(400).send(); //Id is not valid
  }

  Todo.findById(id)
    .then(todo => {
      if (!todo) return res.status(404).send(); //todo not exist!
      return res.status(200).send(todo);
    })
    .catch(e => {
      res.status(400).send(); //other error occured
    });
});

app.delete("/todos/:id", (req, res) => {
  //get the id
  var id = req.params.id; // to łapie to id z adresu
  //validate the i if not valid return 404
  if (!ObjectID.isValid(id)) {
    return res.status(404).send(); //Id is not valid
  }
  //remove todo by id if no doc send 404 if success send doc beck with 200
  Todo.findByIdAndRemove(id)
    .then(todo => {
      if (!todo) return res.status(404).send(); //todo not exist!
      return res.status(200).send({ todo });
    })
    .catch(e => {
      res.status(400).send();
    });
});

app.patch("/todos/:id", (req, res) => {
  var id = req.params.id;
  //ZABEZPIECZENIE ŻEBY UŻYTKWONIK NIE MÓGŁ UPDETOWAC WSZYSTKIEGO!
  var body = _.pick(req.body, ["text", "completed"]); // pick pozwala tylko na modyfikowanie tych wartości jakie sa w nawiasach!!!
  if (!ObjectID.isValid(id)) {
    return res.status(404).send(); //Id is not valid
  }
  //Ustawainie completedAt jeśli użytkownik zupdetował że completed
  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime(); // jeśli zadanie zostanie skonczone to ustaw czas
  } else {
    body.completed = false;
    body.completedAt = false;
  }

  Todo.findByIdAndUpdate(id, { $set: body }, { new: true })
    .then(todo => {
      //to {new:true} oznacza, ze zwóci zupdetowany obiekt
      if (!todo) return res.status(404).send();
      res.send(todo);
    })
    .catch(e => {
      res.status(400).send();
    });
});
app.listen(port, () => {
  console.log(`Started server on port ${port}`);
});

module.exports = { app };
