const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const bcrypt = require("bcryptjs");
var UserSchema = new mongoose.Schema({
  // schemat usert, który w przeciwieństwie do modelu może zawierać motedy
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: "{VALUE} is not a valid email"
    }
  },
  password: {
    type: String,
    require: true,
    minlength: 6
  },
  tokens: [
    {
      access: {
        type: String,
        required: true
      },
      token: {
        type: String,
        required: true
      }
    }
  ]
});

UserSchema.methods.toJSON = function() {
  //nadpisanie defaultowej metody schematu
  var user = this;
  var userObject = user.toObject();

  return _.pick(userObject, ["_id", "email"]);
};

UserSchema.methods.generateAuthToken = function() {
  //metoda schematu, musi być function bo korzystam z this
  var user = this;
  var access = "auth";
  var token = jwt
    .sign({ _id: user._id.toHexString(), access }, "abc123")
    .toString();

  user.tokens = user.tokens.concat([{ access, token }]);

  return user.save().then(() => {
    return token;
  });
};

UserSchema.statics.findByToken = function(token) {
  var User = this;
  var decoded;

  try {
    decoded = jwt.verify(token, "abc123");
  } catch (e) {
    return Promise.reject(); //skrócona wersja Promise
  }
  //if success
  return User.findOne({
    // zwróć user;a który spełania:
    _id: decoded._id, //id po zweryfikowaniu po jwt
    "tokens.token": token, //token pasuje
    "tokens.access": "auth"
  });
};
UserSchema.pre("save", function(next) {
  var user = this;

  if (user.isModified("password")) {
    // co ma zrobić gdy użytkownik modyfikuje już swoje haslo
    //CZYLI WPISAL HASLO KTORE PRZESZLO WALIDACJE
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    }); //za kazdtm razem generuje inną sól
  } else {
    next();
  }
});

UserSchema.statics.findByCredentials = function(email, password) {
  var User = this;

  return User.findOne({ email }).then(user => {
    if (!user) {
      return Promise.reject();
    }

    //ncrypt pracuje tylko an cllbackach dlatego musze zrobic nowe Promise
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) resolve(user);
        else reject();
      });
    });
  });
};

var User = mongoose.model("User", UserSchema);

module.exports = { User };
