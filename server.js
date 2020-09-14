const express = require("express");
const http = require("http");
const path = require("path");
const socketIO = require("socket.io");
const ytdl = require("ytdl-core");
const fs = require("fs");

const app = express();
const server = http.Server(app);
const io = socketIO(server);

app.set("port", 5000);
app.use("/static", express.static(__dirname + "/static"));

app.get("/", function(request, response) {
    response.sendFile(path.join(__dirname, "index.html"));
});

server.listen(5000, function() {
  console.log("Starting server on port 5000");
});

users = {};

io.on("connection", function(socket) {
    socket.on("new user", function() {
        users[socket.id] = undefined;
    });

    socket.on("click play", function() {
        io.sockets.emit("play");
    });

    socket.on("click pause", function() {
        io.sockets.emit("pause");
    });

    socket.on("send time", function(time) {
        io.sockets.emit("play at time", time);
    });

    socket.on("state", function(data) {
        users[socket.id] = data;
    });

    socket.on("disconnect", function() {
        delete users[socket.id];
    });

    socket.on("new video", function(URL) {
        io.sockets.emit("clicked submit");
        ytdl(URL, {filter:"audioandvideo",quality:"highestvideo"})
            .pipe(fs.createWriteStream("./static/videos/video.mp4")
                    .on("error", function(err) {
                    })
                    .on("finish", function() {
                    })
                    )
            .on("finish", function() {
                io.sockets.emit("change video");
            });
    });
});

setInterval(function() {
    if (Object.keys(users).length > 0) {
        io.sockets.emit("state server", users);
    }
}, 1000 / 20);
