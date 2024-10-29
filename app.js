const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
var https = require("https");
const mongoose = require("mongoose");
const socket = require("./socket");
const multer = require("multer");
const cors = require("cors");
var cron = require("node-cron");

const filesize = require("filesize");
const fs = require("fs");

const users = {};
const port = 3000;

// Certificate
// const privateKey = fs.readFileSync("/etc/letsencrypt/live/tqadmin.mubaraktech.com/privkey.pem", "utf8");
// const certificate = fs.readFileSync("/etc/letsencrypt/live/tqadmin.mubaraktech.com/cert.pem", "utf8");
// const ca = fs.readFileSync("/etc/letsencrypt/live/tqadmin.mubaraktech.com/chain.pem", "utf8");

// const credentials = {
//   key: privateKey,
//   cert: certificate,
//   ca: ca,
// };

/* ------------------------------- controller ------------------------------- */
const adminController = require("./controllers/adminController");

/* --------------------------------- Routes --------------------------------- */
const chatRoutes = require("./routes/chat.js");
const adminRoutes = require("./routes/admin.js");

const app = express();

app.use(cors());

app.use("/audios", express.static(__dirname + "/resources/audios"));
app.use("/images", express.static(__dirname + "/resources/images"));
app.use("/videos", express.static(__dirname + "/resources/videos"));
app.use("/documents", express.static(__dirname + "/resources/documents"));

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "audiofile") {
      cb(null, "./resources/audios"); // <- AUDIO file
    } else if (file.fieldname === "videofile") {
      cb(null, "./resources/videos"); // <- VIDEO file
    } else if (file.fieldname === "docfile") {
      cb(null, "./resources/documents"); // <- DOCUMENT file
    } else {
      cb(null, "./resources/images"); // <- IMAGE file
    }
  },
  filename: (req, file, cb) => {
    if (file.fieldname === "docfile") {
      const size = filesize(req.body.size);
      const customName = size + "-" + file.originalname;
      cb(null, Date.now() + "-_" + customName);
    } else {
      const len = file.originalname.split(".").length;
      cb(null, Date.now() + "." + file.originalname.split(".")[len - 1]);
    }
  },
});

// const imageStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "./resources/images");
//   },
// });

app.use(bodyParser.json());

// app.use("/chat", multer({ storage: fileStorage }).single("audiofile"));

app.use(
  "/chat",
  multer({ storage: fileStorage }).fields([
    {
      name: "imagefile",
      maxCount: 1,
    },
    {
      name: "audiofile",
      maxCount: 1,
    },
    {
      name: "videofile",
      maxCount: 1,
    },
    {
      name: "docfile",
      maxCount: 1,
    },
  ])
);

/* -------------------------------------------------------------------------- */
/*                                   ROUTES                                  */
/* -------------------------------------------------------------------------- */

app.use("/chat", chatRoutes);

app.use("/admin", adminRoutes);

/* -------------------------------------------------------------------------- */

app.use("/users", (req, res, next) => {
  res.send(users);
});

// app.use("/", (req, res, next) => {
//   res.send("You acheived");
// });
mongoose
  .connect(
    "mongodb+srv://tqacademy:tqadmin123@cluster0.gbmp9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    // "mongodb://127.0.0.1:27017/tqacademy?directConnection=true&serverSelectionTimeoutMS=2000",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then((result) => {
    console.log("MongoDB Connected");

    const server = http.createServer(app); //app.listen(3000);
    // const server = https.createServer(credentials, app); //app.listen(3000);
    socket.setServer(server); // My function to pass server varibale.
    server.listen(process.env.PORT || port, () => console.log("Listening on port " + port));
    // server.listen(445);
    const io = socket.init(server);

    // Setting LISTENERS on DATABASE
    adminController.listenZoomLive();
    adminController.getTokens();

    // Satinize DB CRON JOB
    cron.schedule("0 0 * * 0", () => {
      console.log("running a task every sunday 12 midnight");
      adminController.sanitizeDB();
    });

    io.on("connection", (client) => {
      console.log("client connected, " + client.id);

      let clientId = client.id;

      client.on("login", (userId) => {
        users[clientId] = userId;

        console.log(users);
        io.emit("online", users);
      });

      client.on("disconnecting", () => {
        delete users[clientId];
        io.emit("offline", users);

        console.log("disconnected " + clientId);
      });
    });
  })
  .catch((err) => console.log(err));
