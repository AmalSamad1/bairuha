let io;
let server;

module.exports = {
  init: (httpServer) => {
    io = require("socket.io")(httpServer, { pingInterval: 20000, pingTimeout: 20000 });

    return io;
  },
  getIO: () => {
    if (!io) {
      console.log("error");
      return;
    }
    return io;
  },
  setServer: (httpServer) => {
    server = httpServer;
  },
  getServer: () => {
    if (!server) {
      console.log("err");
    }
    return server;
  },
  //   setClient: (socket) => {
  //     client = socket;
  //   },
  //   getClient: () => {
  //     if (!client) {
  //       console.log("no clients registered");
  //       return;
  //     }
  //     return client;
  //   },
};
