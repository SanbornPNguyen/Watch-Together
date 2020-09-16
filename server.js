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

let rooms = {};

function findRoom(socketID) {
    const allRooms = Object.keys(rooms);
    let foundRoom = undefined

    for (let i = 0; i < allRooms.length; i++) {
        let room = allRooms[i];
        if (Object.keys(rooms[room].users).includes(socketID)) {
            return room;
        }
    }
    return "Not found."
}

io.on("connection", function(socket) {
    socket.on("create", () => {
        let room = (Math.floor(Math.random() * 100000)).toString();

        while (Object.keys(rooms).includes(room)) {
            room = (Math.floor(Math.random() * 100000)).toString();
        }

        rooms[room] = {
            roomID: room,
            users: {}
        }

        rooms[room].users[socket.id] = undefined;

        socket.join(room);
        socket.emit("joinState", room);
    });

    socket.on("join", (room) => {
        if (Object.keys(rooms).includes(room)) {
            rooms[room].users[socket.id] = undefined;
            socket.join(room);
            socket.emit("joinState", room);
        } else {
            socket.emit("joinState", "room not found");
        }
    });

    socket.on("disconnect", () => {
        const allRooms = Object.keys(rooms);
        allRooms.forEach((room) => {
            if (Object.keys(rooms[room].users).includes(socket.id)) {
                delete rooms[room].users[socket.id];
            }
            if (Object.keys(rooms[room].users).length === 0) {
                // This doesn't run because we removed the socket.id from the list of rooms above already
                // Whoops, might want to rearrange the code somehow
                let path = "./static/videos/" + findRoom(socket.id) + ".mp4";
                fs.unlink(path, (err) => {
                    console.log(err);
                });

                delete rooms[room];
            }
            
            
        });
    });

    socket.on("submitVideo", (URL) => {
        io.to(findRoom(socket.id)).emit("submittedURL");

        ytdl(URL, {filter:"audioandvideo",quality:"highestvideo"})
            .pipe(fs.createWriteStream("./static/videos/" + findRoom(socket.id) + ".mp4")
                    .on("error", function(err) {
                    })
                    .on("finish", function() {
                    })
                    )
            .on("finish", function() {
                io.to(findRoom(socket.id)).emit("loadVideo", findRoom(socket.id));
            });
        
    });

    socket.on("sendTime", (time) => {
        io.to(findRoom(socket.id)).emit("playAtTime", time);
    });

    socket.on("clickPlay", () => {
        io.to(findRoom(socket.id)).emit("play");
    });

    socket.on("clickPause", () => {
        io.to(findRoom(socket.id)).emit("pause");
    });

    socket.on("clientState", (data) => {
        rooms[findRoom(socket.id)].users[socket.id] = data;
    });
});

setInterval(() => {
    if (Object.keys(rooms).length > 0) {
        const allRooms = Object.keys(rooms);
        allRooms.forEach((room) => {
            io.to(room).emit("serverState", rooms[room].users);
        });
    }
}, 1000 / 20);
