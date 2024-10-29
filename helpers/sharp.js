const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
const ffmpeg_static = require("ffmpeg-static");
// const fs = require("fs");
// const ffmpeg = require("ffmpeg-static");
// const genThumbnail = require("simple-thumbnail");

exports.createThumbnail = (imageFile) => {
  const dir = imageFile.path.split("/");
  dir.pop();
  const newDir = dir.join("/");

  const filename = imageFile.path.split("/").pop();

  const newPath = newDir + "/thumbnails/" + filename;

  sharp(imageFile.path)
    .resize({
      fit: sharp.fit.contain,
      width: 100,
    })
    .jpeg({ quality: 50 })
    .toFile(newPath)
    .then((data) => {
      console.log(data);
    });
};

exports.createVideoThumbnail = (videoFile) => {
  const dir = videoFile.path.split("/"); //[ 'resources', 'videos', '1627611820798.mp4' ]
  dir.pop(); // [ 'resources', 'videos' ]

  const newDir = dir.join("/"); // resources/videos

  let filename = videoFile.path.split("/").pop(); // 1627612059312.mp4
  filename = filename.split(".")[0] + ".jpg"; // 1627612059312

  const newPath = newDir + "/thumbnails/"; // resources/videos/thumbnails/1627612267502.jpg
  console.log(videoFile.path);
  console.log(newPath);

  ffmpeg(videoFile.path)
    .setFfmpegPath(ffmpeg_static)
    .screenshots({
      timestamps: [0.0],
      filename: filename,
      folder: newPath,
      size: "200x?",
    })
    .on("end", function () {
      console.log("done");
      return filename;
    });
};
