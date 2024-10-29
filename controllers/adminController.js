var admin = require("firebase-admin");
const axios = require("axios").default;
const razorpay = require("razorpay");

const mongoose = require("mongoose");
const MessageModel = require("../models/message");
const deleteHelper = require("../helpers/delete");

var serviceAccount = require("../key/tqacademy95-firebase-adminsdk-yhsg5-45d50b6ae2.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://tqacademy95-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const db = admin.database();
const auth = admin.auth();
const message = admin.messaging();

let tokens = [];

const clientId = "rzp_live_fNUhG06V3aaAth";
const clientSecret = "HiA5BVXD7j388xUPvSFzqS7v";

/* -------------------------- Authenticate Requests ------------------------- */

exports.checkAuth = (req, res, next) => {
  const token = req.get("token64");
  if (token == null) {
    //res.status(401).json({ message: "Cannot access this part" });
    res.send("DDDDD");
    console.log("No Token attached");

    return;
  }

  auth
    .verifyIdToken(token)
    .then((decodedToken) => {
      next();
    })
    .catch((e) => {
      console.log("Invalid Token");
      res.status(401).json({ message: "Cannot access the server" });
      return;
    });
};

/* ----------------------- Admin Controller Functions ----------------------- */

exports.deleteUser = async (req, res, next) => {
  const userId = req.body.userId;

  console.log("DELETE USER ");
  console.log(userId);

  await auth.deleteUser(userId).then(() => {
    res.status(200).json({ message: "OK" });
  });

  console.log("User Deleted");

  // The database related to the user are deleted from the admin panel client side.
};

exports.resetUserPassword = (req, res, next) => {
  const userId = req.body.userId;
  const password = req.body.password;

  // console.log(userId);
  console.log("RESET USER PASS");
  auth.updateUser(userId, {
    password: password,
  });
  res.status(200).json({ message: "OK" });

  // The database related to the user are deleted from the admin panel client side.
};

exports.resetUserEmail = async (req, res, next) => {
  const userId = req.body.userId;
  const userEmail = req.body.email;

  console.log("RESET USER EMAIL");

  auth.updateUser(userId, {
    email: userEmail,
  });
  res.status(200).json({ message: "OK." });

  // The database related to the user are deleted from the admin panel client side.
};

exports.getDetails = async (req, res, next) => {
  const userId = req.params.uid;

  console.log(" USER DETAILS");

  auth
    .getUser(userId)
    .then((user) => {
      console.log(user);
      res.status(200).json({ message: "OK." });
    })
    .catch((e) => {
      console.log("NO USER FOUND");
    });

  // The database related to the user are deleted from the admin panel client side.
};

exports.sendInterviewNotification = (req, res, next) => {
  const userId = req.body.userId;
  this.postNotification(
    userId,
    "Pending Interview",
    "you are called for an interview, connect now!"
  );
};

exports.createOrder = (req, res, next) => {
  const amount = req.body.amount;
  const receipt = req.body.receipt;
  const description = req.body.description;

  let token =
    "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64");

  const url = "https://api.razorpay.com/v1/orders";

  axios
    .post(
      url,
      {
        amount: amount,
        currency: "INR",
        receipt: receipt,
        notes: {
          description: description,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      }
    )
    .then((result) => {
      res.json({
        reqstatus: result.status,
        order_id: result.data["id"],
        amount: result.data["amount"],
      });
    })
    .catch((e) => {
      console.log(e);
    });
};

exports.checkSignature = (req, res, next) => {
  const order_id = req.body.order_id;
  const razorpay_payment_id = req.body.razorpay_payment_id;

  var crypto = require("crypto");

  var hash = crypto
    .createHmac("sha256", clientSecret)
    .update(order_id + "|" + razorpay_payment_id)
    .digest("hex");

  res.status(200).json({
    hash: hash,
  });
};

exports.checkAdmin = (req, res, next) => {
  const email = req.params.email;

  const check = db
    .ref("admin")
    .child("accounts")
    .get()
    .then((data) => {
      var accounts = data.val();
      var results = [];

      var toSearch = email;

      for (var i = 0; i < accounts.length; i++) {
        for (key in accounts[i]) {
          if (accounts[i][key].indexOf(toSearch) != -1) {
            results.push(objects[i]);
          }
        }
      }

      const existingList = results;
      if (existingList) {
        res.status(200).json({ message: "found" });
      } else {
        res.status(404).json({ message: "notfound" });
      }
    });
};

exports.notifyAdmins = (req, res, next) => {
  this.postAdminNotification(
    "New Admission",
    "a new admission is waiting for review"
  );
};

/* ----------------------- Post Notification Function ----------------------- */

exports.addToken = (req, res, next) => {
  const token = req.body.token;
  console.log(token);

  const found = tokens.find((tok) => tok === token);
  if (found) {
    return;
  }

  //tokens.push(token);
  // TOKEN_STORE

  const ref = db.ref("admin").child("tokens");
  ref.set([token]).then((val) => {
    console.log("DONE");
    res.status(201).json({
      message: "OK",
    });
  });
};

exports.getTokens = () => {
  const ref = db.ref("admin").child("tokens");
  ref.on("value", (snapshot, b) => {
    if (snapshot.val() != null) {
      tokens = snapshot.val();
    }
    console.log(snapshot.val());
  });
};

exports.postNotification = (topic, title, description) => {
  const msg = {
    data: {
      classroomId: topic,
    },
  };

  message.send({
    topic: topic,
    android: {
      priority: "high",
      notification: {
        defaultSound: true,
        //sound: "default",
      },
    },
    // tokens: ["token_1", "token_2"],
    data: {
      somedata: "avlue",
    },
    notification: {
      title: title,
      body: description,
      // imageUrl:

      //   "https://i.picsum.photos/id/999/536/354.jpg?hmac=xYKikWHOVjOpBeVAsIlSzDv9J0UYTj_tNODJCKJsDo4",
      // sound: "default",
    },
  });
  console.log("sending notificatoin to " + topic);
};

exports.postAdminNotification = (title, description) => {
  message
    .sendMulticast({
      tokens: tokens,

      data: {
        somedata: "avlue",
      },
      notification: {
        title: title,
        body: description,
        // imageUrl:

        //   "https://i.picsum.photos/id/999/536/354.jpg?hmac=xYKikWHOVjOpBeVAsIlSzDv9J0UYTj_tNODJCKJsDo4",
        // sound: "default",
      },
    })
    .then((val) => {
      //console.log(val);
      let invalidIndexList = [];

      if (val.failureCount > 0) {
        val.responses.forEach((e, index) => {
          console.log("SDD => " + e.success + " - " + index);
          if (e.success === false) {
            invalidIndexList.push(index);
          }
        });
      }

      let newTokens = [];

      newTokens = tokens.filter(
        (t, index) => !invalidIndexList.includes(index)
      );

      db.ref("admin")
        .child("tokens")
        .set(newTokens)
        .then((val) => {
          console.log("Updating tokens");
        });
    });
  console.log("sending notificatoin to admins");
};

exports.checkPhoneNumber = async (req, res, next) => {
  const phone = req.body.phone;
  const email = req.body.email;

  let emailExists = false;
  let phoneExists = false;

  await auth
    .getUserByPhoneNumber(phone)
    .then((val) => {
      phoneExists = true;
      //res.status("406").json({ message: "ERROR" });
    })
    .catch((err) => {
      phoneExists = false;
    });

  await auth
    .getUserByEmail(email)
    .then((val) => {
      emailExists = true;
      //res.status("406").json({ message: "ERROR" });
    })
    .catch((err) => {
      emailExists = false;
    });

  if (phoneExists || emailExists) {
    res
      .status(406)
      .json({ phoneExists: phoneExists, emailExists: emailExists });
  } else {
    res.status(200).json({ message: "OK" });
  }

  // const ref = db
  //   .ref()
  //   .child("users")
  //   .orderByChild("phone")
  //   .equalTo(phone)
  //   .once("value")
  //   .then((snapshot) => {
  //     if (snapshot.val() != null) {
  //       res.status(406).json({ message: "ERROR" });
  //     } else {
  //       const ref = db
  //         .ref()
  //         .child("instructors")
  //         .orderByChild("phone")
  //         .equalTo(phone)
  //         .once("value")
  //         .then((snapshot) => {
  //           if (snapshot.val() != null) {
  //             res.status(406).json({ message: "ERROR" });
  //           } else {
  //             res.status("200").json({ message: "OK" });
  //           }
  //         });
  //     }
  //   });
};

/* --------------------------- Listening to LiveDB -------------------------- */

// listening zoom live events

exports.listenZoomLive = () => {
  db.ref()
    .child("classrooms")

    .on("child_changed", (datasnapshot, b) => {
      console.log("listening to zoom live status");
      const classId = datasnapshot.key;
      const classroom = datasnapshot.val();
      const zoomOpen = classroom["zoom_open"];

      if (zoomOpen) {
        this.postNotification(
          classId,
          "Class Started",
          "your class is started on zoom, join now!"
        );
        setTimeout(() => {
          console.log("Setting back to live offline - " + classId);
          db.ref("classrooms").child(classId).update({
            zoom_open: false,
          });
        }, 10000);
      }
    });
};

exports.sanitizeDB = () => {
  var datetime = new Date();

  datetime.setDate(datetime.getDate() - 7);
  console.log(datetime);
  console.log("=====");
  MessageModel.find().then((clases) => {
    clases.forEach((cls) => {
      // LOOPIGN EACH CLASS ID IN MESSAGE TABLE
      console.log("date is " + datetime);
      MessageModel.aggregate(
        // Find matching documents (would benefit from an index on `{uid: 1}`)
        [
          {
            $match: {
              _id: cls._id,
            },
          },

          // Unpack the assignments array
          { $unwind: "$messages" },

          // Find the assignments ending after given date
          {
            $match: {
              "messages.createdAt": { $lte: datetime },
            },
          },
        ]
      )

        // MessageModel.find(
        //   //[{ $unwind: "$messages" }]
        //   {
        //     _id: cls._id,
        //     messages: {
        //       $elemMatch: { createdAt: { $gt: datetime } },
        //     },
        //   }
        // )
        .then((selectedClasses) => {
          //res.json(messages);
          //  console.log(messages[0].messages);
          // console.log(selectedClasses);
          if (selectedClasses.length) {
            selectedClasses.forEach((selectedCls) => {
              //     console.log("Messages Len " + selectedCls.messages.length);

              console.log(selectedCls._id, selectedCls.messages._id);
              deleteMsgAndAsset(selectedCls._id, selectedCls.messages._id);
              // deleteMsgAndAsset(selectedCls._id, selectedCls.)
              // selectedCls.messages.forEach((msg) => {
              //   console.log(msg.createdAt.toString());
              // });
            });
            //console.log(cls._id);
          }
        })
        .catch((err) => console.log(err));
    });
  });
};

let deleteMsgAndAsset = (classId, msgId) => {
  // const classId = req.body.classroomId;
  // const msgId = req.body.msgId;

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
