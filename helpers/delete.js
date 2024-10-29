const fs = require("fs");

exports.deleteMessageAssets = (msg) => {
  if (msg.type != "text") {
    const content = msg.content;
    const filename = content.split("/").pop();
    console.log(filename);

    if (msg.type === "image") {
      // DELETING THE IMAGES LINKED TO THE MESSAGE
      fs.unlink("resources/images/" + filename, (err) => {
        if (err != null) console.log(err);
      });
      fs.unlink("resources/images/thumbnails/" + filename, (err) => {
        if (err != null) console.log(err);
      });
    } else if (msg.type === "video") {
      // DELETING THE VIDEOS LINKED TO THE MESSAGE
      fs.unlink("resources/videos/" + filename, (err) => {
        if (err != null) console.log(err);
      });
      // Calculating the thumbnail filename
      var thumbnailFile = filename.split(".");
      thumbnailFile.pop();
      thumbnailFile.push("jpg");
      thumbnailFile = thumbnailFile.join(".");

      //deleting the thumbnail file
      fs.unlink("resources/videos/thumbnails/" + thumbnailFile, (err) => {
        if (err != null) console.log(err);
      });
    } else if (msg.type === "audio") {
      // DELETING THE AUDIOS LINKED TO THE MESSAGE
      fs.unlink("resources/audios/" + filename, (err) => {
        if (err != null) console.log(err);
      });
    } else {
      fs.unlink("resources/documents/" + filename, (err) => {
        if (err != null) console.log(err);
      });
    }
  }
};
