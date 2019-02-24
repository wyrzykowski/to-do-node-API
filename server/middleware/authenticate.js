var { User } = require("./../models/user");

var authenticate = (req, res, next) => {
  //to request, który jesli sie go wywoała z tokenem to zwóci użytkownika
  var token = req.header("x-auth"); //x-auth to token zapisany w przegladarce chyba

  User.findByToken(token)
    .then(user => {
      if (!user) {
        //gdy nie znajdzie user'a z takim tokenem
        return Promise.reject(); //promise.reject spwooduje, że funkcja sie nie wykona, a wywali bła który zostanie zlapany przez catch block poniżej tam
      }
      req.user = user;
      req.token = token;
      next(); // wywołuje następne argumenty jakby z tegoapp.get!!!
    })
    .catch(e => {
      res.status(401).send();
    }); //model Method
};

module.exports = { authenticate };
