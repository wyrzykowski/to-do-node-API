const expect = require("expect");
const request = require("supertest");
const { ObjectID } = require("mongodb");
const { app } = require("./../server");
const { Todo } = require("./../models/todo");
const { todos, populateTodos, users, populateUsers } = require("./seed/seed");
const { User } = require("./../models/user");
beforeEach(populateUsers);
beforeEach(populateTodos);

describe("POST /todos", () => {
  it("should create a new todo ", done => {
    var text = "Test todo text";

    request(app)
      .post("/todos")
      .set("x-auth", users[0].tokens[0].token) // po to zeby mial dostep do todos, ktore teraz sa prywatn i tylko dostpene dla zalogowanego uzytkownika
      .send({ text })
      .expect(200)
      .expect(res => {
        expect(res.body.text) === text;
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        //now if everything above was good, try to fetch data from database
        Todo.find({ text }) //FOR GET TEST - zeby byl rowny tylko temu textowi ktory znajdzie w mongo a nie wszystko co ma tam
          .then(todos => {
            expect(todos.length) === 1;
            expect(todos[0].text) === text;
            done();
          })
          .catch(e => {
            // this catch error which can occur inside callback
            done(e);
          });
      });
  });

  // #2 tesing if app can create document in database with invalid data
  it("should not create todo with invalid body data", done => {
    var text = " ";
    request(app)
      .post("/todos")
      .set("x-auth", users[0].tokens[0].token)
      .send({ text })
      .expect(400) // 400 bo chce uzyskac bad request
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        //now if everything above was good, try to fetch data from database
        Todo.find()
          .then(todos => {
            expect(todos.length) === 2; // Should be 0 //GET TEST 2 bo do get testuje 2 dokumenty
            done();
          })
          .catch(e => {
            // this catch error which can occur inside callback
            done(e);
          });
      });
  });
});

describe("GET /todos", () => {
  it("should get all todos", done => {
    request(app) // superTest request
      .get("/todos")
      .set("x-auth", users[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body.todos.length) === 1;
      })
      .end(done);
  });
});

describe("get /todos/:id", () => {
  it("Should return todo doc", done => {
    request(app) // superTest request
      .get(`/todos/${todos[0]._id.toHexString()}`) // Musze uzyc toHexString() !!!
      .set("x-auth", users[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body.text) === todos[0].text;
      })
      .end(done);
  });

  it("Should not return todo doc created by other user", done => {
    request(app) // superTest request
      .get(`/todos/${todos[1]._id.toHexString()}`) //chce tostac todos[1], ktory nalez do uzytkownika users[1] wiec powinno wywalic blad bo nie mma teo tego praw
      .set("x-auth", users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it("Should return 404 if todo not found", done => {
    var hexId = new ObjectID().toHexString();
    request(app)
      .get(`/todos/${hexId}`)
      .set("x-auth", users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it("Should return 400 if Id is invalid", done => {
    request(app)
      .get(`/todos/invalidID`)
      .set("x-auth", users[0].tokens[0].token)
      .expect(400)
      .end(done);
  });
});

describe("DELTE /todos/:id,", () => {
  //TRUDNY TEST
  it("should remove a todo", done => {
    var hexId = todos[1]._id.toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .set("x-auth", users[1].tokens[0].token) //user[1] bo usuwam todos[1] a to nalezy do tego suera
      .expect(200)
      .expect(res => {
        expect(res.body.todo._id) === hexId;
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        //Sprawdzenie czy delete naprawde usunął dokument
        Todo.findById(hexId)
          .then(res => {
            expect(res).toBeFalsy();
            done();
          })
          .catch(e => {
            done(e);
          });
      });
  });

  it("should not remove a todo if user not created it", done => {
    var hexId = todos[0]._id.toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .set("x-auth", users[1].tokens[0].token) //user[1] bo usuwam todos[1] a to nalezy do tego suera
      .expect(404)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        //Sprawdzenie czy delete naprawde usunął dokument
        Todo.findById(hexId)
          .then(res => {
            expect(res).toBeTruthy();
            done();
          })
          .catch(e => {
            done(e);
          });
      });
  });

  it("should return 404 if todo not found", done => {
    var hexId = new ObjectID().toHexString();
    request(app)
      .delete(`/todos/${hexId}`)
      .set("x-auth", users[1].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it("should return 404 if object id is invalid", done => {
    request(app)
      .delete(`/todos/InvalidId`)
      .set("x-auth", users[1].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

describe("PATCH /todos/:id ", () => {
  it("should update body of todo", done => {
    var hexId = todos[1]._id.toHexString();
    var customBody = {
      completed: true,
      text: "Test Text"
    };
    request(app)
      .patch(`/todos/${hexId}`)
      .set("x-auth", users[1].tokens[0].token)
      .send(customBody) // uwaga tu bez { } bo juz przekazuje obeikt
      .expect(200)
      .expect(res => {
        expect(res.body.text) === customBody.text;
        expect(res.body.completed) === customBody.completed;
        expect(typeof res.body.completedAt).toBe("number"); //to ten czas ukoneczenia zadania
      })
      .end(done);
  });

  it("should not update body of todo if todos was not created by that user", done => {
    var hexId = todos[0]._id.toHexString();
    var customBody = {
      completed: true,
      text: "Test Text"
    };
    request(app)
      .patch(`/todos/${hexId}`)
      .set("x-auth", users[1].tokens[0].token)
      .send(customBody) // uwaga tu bez { } bo juz przekazuje obeikt
      .expect(404)
      .end(done);
  });

  it("should set completedAt null when updated to completed:false", done => {
    var hexId = todos[0]._id.toHexString();
    var customBody = {
      completed: false,
      text: "Test Text"
    };
    request(app)
      .patch(`/todos/${hexId}`)
      .set("x-auth", users[0].tokens[0].token)
      .send(customBody) // uwaga tu bez { } bo juz przekazuje obeikt
      .expect(200)
      .expect(res => {
        expect(res.body.text) === customBody.text;
        expect(res.body.completed) === false;
        expect(res.body.completedAt).toBeFalsy(); //UWAGA tu musi byc toNotExist null nie zadziała
      })
      .end(done);
  });

  it("should return 404 if todo not found", done => {
    var hexId = new ObjectID().toHexString();
    request(app)
      .patch(`/todos/${hexId}`)
      .set("x-auth", users[1].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it("should return 404 if object id is invalid", done => {
    request(app)
      .patch(`/todos/InvalidId`)
      .set("x-auth", users[1].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

describe("GET /users/me", () => {
  it("should return user if authenticated", done => {
    request(app)
      .get("/users/me")
      .set("x-auth", users[0].tokens[0].token) // set słuzy do ustawienia headera w supetescie
      .expect(200)
      .expect(res => {
        expect(res.body._id) === users[0]._id.toHexString();
        expect(res.body.email) === users[0].email;
      })
      .end(done);
  });
  it("should return 401 if not authenticated", done => {
    request(app)
      .get("/users/me")
      .expect(401)
      .expect(res => {
        expect(res.body).toEqual({}); //dostane puste body
      })
      .end(done);
  });
});

describe("POST /users", () => {
  it("should create a user", done => {
    var email = "example@example.com";
    var password = "123mnb!";

    request(app)
      .post("/users")
      .send({ email, password })
      .expect(200)
      .expect(res => {
        expect(res.headers["x-auth"]).toBeTruthy();
        expect(res.body._id).toBeTruthy();
        expect(res.body.email) === email;
      })
      .end(err => {
        //Sprawdzanie czy user jest w bazie danych
        if (err) {
          return done(err);
        }
        User.findOne({ email })
          .then(user => {
            expect(user).toBeTruthy();
            expect(user.password).not.toBe(password); //sprawdza czy hasło się zhasowało
            done();
          })
          .catch(e => done(e));
      });
  });
  it("Should return validation errors if request invalid", done => {
    request(app)
      .post("/users")
      .send({ email: "invalid email", password: "inv" })
      .expect(400)
      .end(done);
  });

  it("Should not create user if email in use", done => {
    request(app)
      .post("/users")
      .send({ email: users[0].email, password: "sadsd" })
      .expect(400)
      .end(done);
  });
});

//testuje tu users[1] bo users[0] w poprzednim teście już zrobił token
describe("POST /users/login", () => {
  it("Skould login user and return auth token", done => {
    request(app)
      .post("/users/login")
      .send({ email: users[0].email, password: users[0].password })
      .expect(200)
      .expect(res => {
        expect(res.headers["x-auth"]).toBeTruthy();
      })
      .end((err, res) => {
        if (err) return done(err);

        //Sprawdzanie czy token, który dostałem z requesta jest zgodny z tym w bazie danych
        User.findById(users[0]._id)
          .then(user => {
            expect(user.toObject().tokens[1]).toMatchObject({
              access: "auth",
              token: res.headers["x-auth"]
            });
            done();
          })
          .catch(e => {
            done(e);
          });
      });
  });

  it("Should reject invalid login ", done => {
    //haslo nie pasuje,
    request(app)
      .post("/users/login")
      .send({ email: users[1].email, password: "wrongPassword" })
      .expect(400)
      .expect(res => {
        expect(res.headers["x-auth"]).toNotExist;
      })
      .end((err, res) => {
        if (err) return done(err);
        User.findById(users[1]._id)
          .then(user => {
            expect(user.tokens.length) === 1; // bo dodalem wseed.js w tablicy token
            done();
          })
          .catch(e => {
            done(e);
          });
      });
  });
});

describe("DELETE /users/me/token", () => {
  it("should remove token ", done => {
    request(app)
      .delete("/users/me/token")
      .set("x-auth", users[0].tokens[0].token)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        User.findById(users[0]._id)
          .then(user => {
            expect(user.tokens.length) === 0;
            done();
          })
          .catch(e => {
            done(e);
          });
      });
  });
});
