const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    sender: {
      type: String,
      required: true,
    },
    sender_name: {
      type: String,
      required: true,
    },
    reply_of: {
      type: String,
    },
  },
  { timestamps: true }
);

// const MessageModel = mongoose.model("Message", messageSchema);

const classroomSchema = new Schema({
  _id: String,
  messages: [messageSchema],
});

const MessageModel = mongoose.model("Message", classroomSchema);

module.exports = MessageModel;
