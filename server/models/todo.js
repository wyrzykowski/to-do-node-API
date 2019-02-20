var mongoose = require("mongoose");

//Create new model
var Todo = mongoose.model("Todo", {
  //CollectionName - name of Collection which will be updated on create new in dataBase
  // Fisrt argument is the name, second: object
  text: {
    type: String,
    required: true, //this value is requires
    minlength: 1, //is forrbidden to be '' empty string
    trim: true //white space is not counting like sign
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Number,
    default: null
  }
});

module.exports = { Todo };
