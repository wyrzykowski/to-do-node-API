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
      .send({ text })
      .expect(200)
      .expect(res => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        //now if everything above was good, try to fetch data from database
        Todo.find({ text }) //FOR GET TEST - zeby byl rowny tylko temu textowi ktory znajdzie w mongo a nie wszystko co ma tam
          .then(todos => {
            expect(todos.length).toBe(1);
            expect(todos[0].text).toBe(text);
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
      .send({ text })
      .expect(400) // 400 bo chce uzyskac bad request
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        //now if everything above was good, try to fetch data from database
        Todo.find()
          .then(todos => {
            expect(todos.length).toBe(2); // Should be 0 //GET TEST 2 bo do get testuje 2 dokumenty
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
      .expect(200)
      .expect(res => {
        expect(res.body.todos.length).toBe(2);
      })
      .end(done);
  });
});

describe("get /todos/:id", () => {
  it("Should return todo doc", done => {
    request(app) // superTest request
      .get(`/todos/${todos[0]._id.toHexString()}`) // Musze uzyc toHexString() !!!
      .expect(200)
      .expect(res => {
        expect(res.body.text).toBe(todos[0].text);
      })
      .end(done);
  });

  it("Should return 404 if todo not found", done => {
    var hexId = new ObjectID().toHexString();
    request(app)
      .get(`/todos/${hexId}`)
      .expect(404)
      .end(done);
  });

  it("Should return 400 if Id is invalid", done => {
    request(app)
      .get(`/todos/invalidID`)
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
      .expect(200)
      .expect(res => {
        expect(res.body.todo._id).toBe(hexId);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        //Sprawdzenie czy delete naprawde usunął dokument
        Todo.findById(hexId)
          .then(res => {
            expect(res).toNotExist();
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
      .expect(404)
      .end(done);
  });

  it("should return 404 if object id is invalid", done => {
    request(app)
      .delete(`/todos/InvalidId`)
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
      .send(customBody) // uwaga tu bez { } bo juz przekazuje obeikt
      .expect(200)
      .expect(res => {
        expect(res.body.text).toBe(customBody.text);
        expect(res.body.completed).toBe(customBody.completed);
        expect(res.body.completedAt).toBeA("number"); //to ten czas ukoneczenia zadania
      })
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
      .send(customBody) // uwaga tu bez { } bo juz przekazuje obeikt
      .expect(200)
      .expect(res => {
        expect(res.body.text).toBe(customBody.text);
        expect(res.body.completed).toBe(false);
        expect(res.body.completedAt).toNotExist(); //UWAGA tu musi byc toNotExist null nie zadziała
      })
      .end(done);
  });

  it("should return 404 if todo not found", done => {
    var hexId = new ObjectID().toHexString();
    request(app)
      .patch(`/todos/${hexId}`)
      .expect(404)
      .end(done);
  });

  it("should return 404 if object id is invalid", done => {
    request(app)
      .patch(`/todos/InvalidId`)
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
        expect(res.body._id).toBe(users[0]._id.toHexString());
        expect(res.body.email).toBe(users[0].email);
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
        expect(res.headers["x-auth"]).toExist();
        expect(res.body._id).toExist();
        expect(res.body.email).toBe(email);
      })
      .end(err => {
        //Sprawdzanie czy user jest w bazie danych
        if (err) {
          return done(err);
        }
        User.findOne({ email }).then(user => {
          expect(user).toExist();
          expect(user.password).toNotBe(password); //sprawdza czy hasło się zhasowało
          done();
        });
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
