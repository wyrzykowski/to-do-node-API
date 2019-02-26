require("./config/config.js");
const _ = require("lodash");
const express = require("express");
const bodyParser = require("body-parser");
const { ObjectID } = require("mongodb");

var { mongoose } = require("./db/mongoose.js");
var { Todo } = require("./models/todo");
var { User } = require("./models/user");
var { authenticate } = require("./middleware/authenticate");

var app = express();
const port = process.env.PORT;

app.use(bodyParser.json()); // set podsy parser to be use by express app
//dzięki temu moge wysyłać coś w postaci JSONA do tej aplikacji, bo będzie mi
//od razu parsował JSONA na obiekt JS, jak tego nie zparsuje to dostane w req.body = undefined
app.post("/todos", authenticate, (req, res) => {
  // dodanie authenticate middlewarre pozwala na zrobienie tego routa prywatnym
  var todo = new Todo({
    text: req.body.text,
    _creator: req.user._id
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

app.get("/todos", authenticate, (req, res) => {
  Todo.find({
    _creator: req.user._id //znajdz tylko te todos ktore naleza do tego uzytkownika
  }).then(
    todos => {
      res.send({ todos });
    },
    e => {
      res.status(400).send(e);
    }
  );
});
//Geting document by request from database by Id
app.get("/todos/:id", authenticate, (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    res.status(400).send(); //Id is not valid
  }

  Todo.findOne({
    _id: id,
    _creator: req.user._id
  })
    .then(todo => {
      if (!todo) return res.status(404).send(); //todo not exist!
      return res.status(200).send(todo);
    })
    .catch(e => {
      res.status(400).send(); //other error occured
    });
});

app.delete("/todos/:id", authenticate, (req, res) => {
  //get the id
  var id = req.params.id; // to łapie to id z adresu
  //validate the i if not valid return 404
  if (!ObjectID.isValid(id)) {
    return res.status(404).send(); //Id is not valid
  }
  //remove todo by id if no doc send 404 if success send doc beck with 200
  Todo.findOneAndRemove({
    _id: id,
    _creator: req.user._id
  })
    .then(todo => {
      if (!todo) return res.status(404).send(); //todo not exist!
      return res.status(200).send({ todo });
    })
    .catch(e => {
      res.status(400).send();
    });
});

app.patch("/todos/:id", authenticate, (req, res) => {
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

  Todo.findOneAndUpdate(
    { _id: id, _creator: req.user._id },
    { $set: body },
    { new: true }
  )
    .then(todo => {
      //to {new:true} oznacza, ze zwóci zupdetowany obiekt
      if (!todo) return res.status(404).send();
      res.send(todo);
    })
    .catch(e => {
      res.status(400).send();
    });
});

//SingUp New User:
app.post("/users", (req, res) => {
  //Mógbtm zrobić tak jak dla pojeynczego todo wyżej ale użye pick:
  var body = _.pick(req.body, ["email", "password"]);
  var user = new User(body);
  user
    .save()
    .then(user => {
      return user.generateAuthToken();
      //res.send(user); // tak bylo kiedys przed tokenami
    })
    .then(token => {
      res.header("x-auth", token).send(user); // ten user, kórego wysyłam pochodz z argumentu wyżej
    })
    .catch(e => {
      res.status(400).send(e);
    });
});

app.get("/users/me", authenticate, (req, res) => {
  res.send(req.user);
});

app.post("/users/login", (req, res) => {
  var body = _.pick(req.body, ["email", "password"]);

  User.findByCredentials(body.email, body.password)
    .then(user => {
      //jeśli udało sie zalogowac użytkownikowi tow ygeneruj token  i ustaw header
      user.generateAuthToken().then(token => {
        res.header("x-auth", token).send(user);
      });
    })
    .catch(e => {
      res.status(400).send();
    });
});

app.delete("/users/me/token", authenticate, (req, res) => {
  req.user.removeToken(req.token).then(
    () => {
      res.status(200).send();
    },
    e => {
      res.status(400).send();
    }
  );
});

app.listen(port, () => {
  console.log(`Started server on port ${port}`);
});

module.exports = { app };
