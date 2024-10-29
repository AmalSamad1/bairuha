const sharp = require("sharp");
const thumb = require("../helpers/sharp");
const MessageModel = require("../models/message");

const mongoose = require("mongoose");

const socket = require("../socket");
const fs = require("fs");
const deleteHelper = require("../helpers/delete");
const path = require("path");
const { getAudioDurationInSeconds } = require("get-audio-duration");
// const { getVideoDurationInSeconds } = require("get-video-duration");

/* -------------------------------------------------------------------------- */
/*                            upload Audio / Voice                            */
/* -------------------------------------------------------------------------- */

exports.uploadAudio = (req, res, next) => {
  const file = req.files.audiofile[0];
  if (!file) {
    console.log("no file found");
    res.status(400).json({ message: "Cannot find attached voice" });
  }
  let dura = 2.0;
  getAudioDurationInSeconds(file.path).then((duration) => {
    console.log("DURA " + duration);

    // load(file.path).then(function (audio) {
    // get audio duration
    // var duration = dura; // audio.duration;
    console.log(duration);
    var append = String(duration).split(".")[0];

    const server = req.body.server;
    const type = req.body.type;
    const senderId = req.body.senderId;
    const senderName = req.body.senderName;
    const classId = req.body.classroomId;

    const p = file.path.split("/");
    p.shift();
    const path = p.join("/");
    const filename = p.pop();

    const finalUrl =
      server + "/" + path + "?&dur=" + append + "&filename=/" + filename;

    const newMessageDoc = {
      _id: mongoose.Types.ObjectId(),
      content: finalUrl,
      sender: senderId,
      sender_name: senderName,
      type: type,
      createdAt: new Date(),
      classId: classId,
    };

    console.log(finalUrl);

    MessageModel.updateOne(
      { _id: classId },
      {
        $push: {
          messages: newMessageDoc,
        },
      },
      { upsert: true }
    )
      .then((msg) => {
        const id = newMessageDoc._id;

        res.json({ message: "success", mid: id });
        socket.getIO().emit("chat", {
          action: "newMessage",
          data: newMessageDoc,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

/* -------------------------------------------------------------------------- */
/*                               upload Document                              */
/* -------------------------------------------------------------------------- */

exports.uploadDoc = (req, res, next) => {
  const file = req.files.docfile[0];
  if (!file) {
    console.log("no file found");
    res.status(400).json({ message: "Cannot find attached document file" });
  }

  const server = req.body.server;
  const type = req.body.type;
  const senderId = req.body.senderId;
  const senderName = req.body.senderName;
  const classId = req.body.classroomId;

  const p = file.path.split("/");
  p.shift();
  const path = p.join("/");

  const newMessageDoc = {
    _id: mongoose.Types.ObjectId(),
    content: server + "/" + path,
    sender: senderId,
    sender_name: senderName,
    type: type,
    createdAt: new Date(),
    classId: classId,
  };

  console.log(server + "/" + path);

  MessageModel.updateOne(
    { _id: classId },
    {
      $push: {
        messages: newMessageDoc,
      },
    },
    { upsert: true }
  )
    .then((msg) => {
      //   console.log(msg);
      const id = newMessageDoc._id;

      res.json({ message: "success", mid: id });
      socket.getIO().emit("chat", {
        action: "newMessage",
        data: newMessageDoc,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

/* -------------------------------------------------------------------------- */
/*                                upload Image                                */
/* -------------------------------------------------------------------------- */

exports.uploadImage = (req, res, next) => {
  const file = req.files.imagefile[0];
  if (!file) {
    console.log("no file found");
    res.status(400).json({ message: "Cannot find attached voice" });
  }
  const server = req.body.server;
  const type = req.body.type;
  const senderId = req.body.senderId;
  const senderName = req.body.senderName;
  const classId = req.body.classroomId;

  // Calculating the directory to append with the Backend URL
  // like 192.168.1.2  need to append with /images/dsfd.png
  const p = file.path.split("/");
  p.shift(); // Removes the first element after split
  p.splice(1, 0, "thumbnails"); // Insert at index[1], remove 0 items, adding 'thumbnails'

  const path = p.join("/"); // Joining the array

  thumb.createThumbnail(file);

  const newMessageDoc = {
    _id: mongoose.Types.ObjectId(),
    content: server + "/" + path, // <- Appending here
    sender: senderId,
    sender_name: senderName,
    type: type,
    createdAt: new Date(),
    classId: classId,
  };

  MessageModel.updateOne(
    { _id: classId },
    {
      $push: {
        messages: newMessageDoc,
      },
    },
    { upsert: true }
  )
    .then((msg) => {
      //   console.log(msg);
      const id = newMessageDoc._id;

      res.json({ message: "success", mid: id });
      socket.getIO().emit("chat", {
        action: "newMessage",
        data: newMessageDoc,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

/* -------------------------------------------------------------------------- */
/*                                upload Video                                */
/* -------------------------------------------------------------------------- */

exports.uploadVideo = (req, res, next) => {
  const file = req.files.videofile[0];
  if (!file) {
    console.log("no file found");
    res.status(400).json({ message: "Cannot find attached video" });
  }
  const server = req.body.server;
  const type = req.body.type;
  const senderId = req.body.senderId;
  const senderName = req.body.senderName;
  const classId = req.body.classroomId;

  // Calculating the directory to append with the Backend URL
  // like 192.168.1.2  need to append with /images/dsfd.png
  const p = file.path.split("/");
  p.shift(); // Removes the first element after split (ie, ... /resources/ ...)
  //  p.splice(1, 0, "thumbnails"); // Insert at index[1], remove 0 items, adding 'thumbnails'
  // const filename = p.pop(); // poped the filename

  //  const thumbFile = filename.split(".")[0] + ".jpg";
  // p.push(thumbFile);
  const path = p.join("/"); // Joining the array

  thumb.createVideoThumbnail(file);

  const newMessageDoc = {
    _id: mongoose.Types.ObjectId(),
    content: server + "/" + path, // <- Appending here
    sender: senderId,
    sender_name: senderName,
    type: type,
    createdAt: new Date(),
    classId: classId,
  };

  console.log(server + "/" + path);

  MessageModel.updateOne(
    { _id: classId },
    {
      $push: {
        messages: newMessageDoc,
      },
    },
    { upsert: true }
  )
    .then((msg) => {
      //   console.log(msg);
      const id = newMessageDoc._id;

      res.json({ message: "success", mid: id });
      socket.getIO().emit("chat", {
        action: "newMessage",
        data: newMessageDoc,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

/* -------------------------------------------------------------------------- */
/*                               delete message                               */
/* -------------------------------------------------------------------------- */

exports.delete = (req, res, next) => {
  const classId = req.body.classroomId;
  const msgId = req.body.msgId;

  MessageModel.findOneAndUpdate(
    { _id: classId },
    {
      $pull: {
        messages: { _id: msgId },
      },
    },
    { useFindAndModify: false }
  )
    .then((ms) => {
      const msg = ms.messages.find((m) => m._id == msgId);

      if (msg === null) {
        console.log("This message was not found in DB");
        return;
      }
      deleteHelper.deleteMessageAssets(msg);
      socket.getIO().emit("chat", {
        action: "deleteMessage",
        data: msgId,
      });
      console.log("Successful deletion");
      res.json({ message: "succcesfully deleted " + msgId });
    })
    .catch((err) => {
      console.log("Deleting message failed " + err);
    });
};

/* -------------------------------------------------------------------------- */
/*                             Get Class Messages                             */
/* -------------------------------------------------------------------------- */

exports.getClassMessages = (req, res, next) => {
  const date = req.body.date;
  const classId = req.body.classroomId;
  if (!classId || !date) return console.log("cannot get the class or date");
  MessageModel.find(
    //[{ $unwind: "$messages" }]
    {
      _id: classId,
      messages: { $elemMatch: { createdAt: { $gt: date } } },
    }
  )
    .then((messages) => {
      console.log(messages);
      //res.json(messages);
      //  console.log(messages[0].messages);
      if (messages.length) {
        console.log(messages);
        res.json(messages[0].messages);
      }
    })
    .catch((err) => console.log(err));
  // console.log(classId);
};

/* -------------------------------------------------------------------------- */
/*                              Add Chat Message                              */
/* -------------------------------------------------------------------------- */

exports.addChatMessage = (req, res, next) => {
  const content = req.body.content;
  const type = req.body.type;
  const senderId = req.body.senderId;
  const senderName = req.body.senderName;
  const replyOf = req.body.reply_of;
  const classId = req.body.classroomId;

  const newMessageDoc = {
    _id: mongoose.Types.ObjectId(),
    content: content,
    sender: senderId,
    sender_name: senderName,
    type: type,
    reply_of: replyOf,
    createdAt: new Date(),
    classId: classId,
  };

  MessageModel.updateOne(
    { _id: classId },
    {
      $push: {
        messages: newMessageDoc,
      },
    },
    { upsert: true }
  )
    .then((msg) => {
      console.log(msg);
      const id = newMessageDoc._id;

      res.json({ message: "success", mid: id });
      socket.getIO().emit("chat", {
        action: "newMessage",
        data: newMessageDoc,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

/* -------------------------------------------------------------------------- */
/*  This is for the web admin panel. to load all chat on server completely.   */
/* -------------------------------------------------------------------------- */

exports.loadAllClass = (req, res, next) => {
  const classId = req.params.classId;

  MessageModel.findOne({ _id: classId })
    .then((classroom) => {
      if (classroom == null) return res.status(200).json([]);
      res.status(200).json({
        classId: classId,
        messages: classroom.messages,
      });
    })
    .catch((err) => console.log(err));
};
