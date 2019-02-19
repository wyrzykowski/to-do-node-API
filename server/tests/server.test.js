const expect = require("expect");
const request = require("supertest");

const { app } = require("./../server");
const { Todo } = require("./../models/todo");

const todos = [
  {
    text: "First test todo"
  },
  {
    text: "second test todo"
  }
];
//Usuwa wszystko z bazy danych na potrzebe testu
//raczej niebezpieczna funkcja xDDD
beforeEach(done => {
  Todo.remove({})
    .then(() => {
      return Todo.insertMany(todos);
    })
    .then(() => done());
});

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
    request(app)
      .get("/todos")
      .expect(200)
      .expect(res => {
        expect(res.body.todos.length).toBe(2);
      })
      .end(done);
  });
});
