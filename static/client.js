const socket = io();

const video = document.getElementById("player");
const table = document.getElementById("users");
const newvid = document.getElementById("newvideo");

socket.emit("new user");

socket.on("play at time", function(time) {
    video.currentTime = time;
});

socket.on("play", function() {
    video.play();
});

socket.on("pause", function() {
    video.pause();
});

socket.on("clicked submit", function() {
    const textBox = document.getElementById("videoURL");
    
    textBox.value = "";
    newvid.setAttribute("hidden", "");
});

socket.on("change video", function(data) {
    video.load();
    newvid.removeAttribute("hidden");
});

let row_prev_length = 0;
let times_arr = [];

socket.on("state server", function(data) {
    if (Object.keys(data).length != row_prev_length) {
        row_prev_length = Object.keys(data).length;

        let rows = table.tBodies[0].rows;
        let row_init_length = rows.length;
        for (let i = 0; i < row_init_length; i++) {
            table.tBodies[0].deleteRow(0);
        }
        
        for (let id in data) {
            let user = data[id];
            let row = table.tBodies[0].insertRow(0);

            let sync_button = document.createElement("Button");
            sync_button.appendChild(document.createTextNode("Sync"));
            sync_button.setAttribute("onclick", "sync();")
            sync_button.onclick = function sync() {
                video.currentTime = document.getElementById(id).innerHTML;
            };

            row.insertCell(0).innerHTML = id;
            row.insertCell(1).setAttribute("id", id);
            document.getElementById(id).innerHTML = user.currentTime;

            if (id === socket.id) {
                row.setAttribute("style", "color: green;");
            } else {
                row.insertCell(2).appendChild(sync_button);
            }
        }
    }
    times_arr = [];
    for (let id in data) {
        times_arr.push(data[id].currentTime);
        document.getElementById(id).innerHTML = data[id].currentTime;
    }
});

const submitButton = document.getElementById("submit");
submitButton.setAttribute("onclick", "submit();");
submitButton.onclick = function submit() {
    const textBox = document.getElementById("videoURL");
    const URL = textBox.value;
    socket.emit("new video", URL);

    textBox.value = "";
    newvid.setAttribute("hidden", "");
};

const syncToMeButton = document.getElementById("syncme");
syncToMeButton.setAttribute("onclick", "syncToMe();");
syncToMeButton.onclick = function syncToMe() {
    socket.emit("send time", video.currentTime);
};

const syncToEarliestButton = document.getElementById("syncearliest");
syncToEarliestButton.setAttribute("onclick", "syncToEarliest();");
syncToEarliestButton.onclick = function syncToEarliest() {
    times_arr.sort(function(a, b){return a - b});
    socket.emit("send time", times_arr[0]);
};

const syncToFurthestButton = document.getElementById("syncfurthest");
syncToFurthestButton.setAttribute("onclick", "syncToFurthest();");
syncToFurthestButton.onclick = function syncToFurthest() {
    times_arr.sort(function(a, b){return b - a});
    socket.emit("send time", times_arr[0]);
};

const playButton = document.getElementById("play");
playButton.setAttribute("onclick", "play();");
playButton.onclick = function play() {
    socket.emit("click play");
};

const pauseButton = document.getElementById("pause");
pauseButton.setAttribute("onclick", "pause();");
pauseButton.onclick = function pause() {
    socket.emit("click pause");
};

setInterval(function() {
    socket.emit("state", {
        currentTime: video.currentTime
    });
}, 1000 / 20);
