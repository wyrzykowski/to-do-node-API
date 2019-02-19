const expect = require("expect");
const request = require("supertest");

const { app } = require("./../server");
const { Todo } = require("./../models/todo");

//Usuwa wszystko z bazy danych na potrzebe testu
//raczej niebezpieczna funkcja xDDD
beforeEach(done => {
  Todo.remove({}).then(() => {
    done();
  });
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
        Todo.find()
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
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        //now if everything above was good, try to fetch data from database
        Todo.find()
          .then(todos => {
            expect(todos.length).toBe(0);
            done();
          })
          .catch(e => {
            // this catch error which can occur inside callback
            done(e);
          });
      });
  });
});
