var express = require("express");
var bodyParser = require("body-parser");

var { mongoose } = require("./db/mongoose.js");
var { Todo } = require("./models/todo");
var { Users } = require("./models/user");

var app = express();

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

app.listen(3000, () => {
  console.log("Started server on port 3000");
});

module.exports = { app };
