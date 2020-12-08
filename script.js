


/* 
** function note **
- bringData()
  Bring a YouTube API data based on video id (v=)

- firstComment()
  Bring a first comment of video which has this video id

- insertInPlaylist()
  Based on parsed data at parsePlaylist()
  put in HTML div

- parsePlaylist()
  Parse the pinned comment that is about playlist timeline, 
  and call the insertInPlaylist() function

- string2time
  change one comment line to time(string)
  EX) 10:30 Muse - Hysteria -> 10:30

- string2value
  change string to time (sec)
  EX) 10:30 -> 630

- title
  Bring a video title of the link
*/

var provider = new firebase.auth.GoogleAuthProvider();
firebase.auth().signInWithPopup(provider).then(function (result) {
    // This gives you a Google Access Token. You can use it to access the Google API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;
    // ...
}).catch(function (error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
    // ...
});
firebase.auth().getRedirectResult().then(function (result) {
    if (result.credential) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = result.credential.accessToken;
        // ...
    }
    // The signed-in user info.
    var user = result.user;
}).catch(function (error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
    // ...
});


//global variable
var videoId;
var api_key;
var search_key;
var load = 0;
var nowPlaying = ["M0", 0];
var timeDic = {};
var inter;
var inter_state = 0;
var db = firebase.database();
var repeat = 0;
var repeat_1 = 0;
var shuffle = 0;
var click = 0;
var video_updates = {
};
var error_var = 1;
var previous = [];
var relate_v = [];
// for YouTube iframe API
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/player_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        width: '400',
        height: '300',
        videoId: 'gX4imVi8R6U',
        playerVars: { rel: 0 },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    event.target.playVideo();
}

function onPlayerStateChange(event) {
    console.log("state change");
    if(player.getPlayerState() == 0 && repeat){ //if video is ended
        player.playVideo();
    }
    if (player.getPlayerState() != 1) {
        inter_state = 0;
        clearInterval(inter);
    }
    if (player.getPlayerState() == 1 && !inter_state) {
        clearInterval(inter);
        click = 1;
        inter = setInterval(changeNowPlaying, 1000, Object.values(timeDic));
        inter_state = 1;
    }
}
// YouTube iframe API code end

function updateError(error_url, msg) {
    db.ref('errors/').update({
        "youtube error url": error_url,
        "error message": msg
    });
}

$(document).keydown(function (key) { //1->49
    if (key.keyCode == 49) {
        console.log(player.getCurrentTime());
    }
    autoenter = 0;
    if (key.keyCode == 13) {
        bringData();
    }
});

$(document).ready(function () {
})


var error_url = "";

function bringData() {
    // if this page is reused
    if (load) {
        document.getElementById("playlist_div").innerHTML = "";
    }
    var videoLink = $('#videoLink').val();

    if (videoLink == "") {
        alert("Please enter the YouTube Playlist Link!");
        return;
    }
    if (!videoLink.includes("v=")) {
        alert("Your Link doesn't contain a 'videoID'. \n Please check your video Link.");
        return;
    }

    videoId = videoLink.split('v=');
    videoId = videoId[1].split('&')[0];
    //console.log(videoId);
    var url = "https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&key=" + api_key + "&videoId=" + videoId + "&maxResults=2";
    error_url = "https://www.youtube.com/watch?v=" + videoId;

    db.ref('videos').once('value',function(snapshot){
        if(snapshot.val().hasOwnProperty(videoId)){ // if there is videoId data in firebase
            console.log("Yes");
            var temp = snapshot.val()[videoId];
            console.log(temp);
            titleArray = temp.titleArray;
            timeArray = temp.timeArray;
            $('#title').text(temp.title);
            player.loadVideoById(videoId, 0, "large");
            player.seekTo(0);
            insertInPlaylist(timeArray, titleArray);
            $("div.RV").css("display", "block");
        }
        else{
            $.get(url, function (data) {
            })
                .done(function (data) {
                    firstComment(data);
        
                    url = "https://www.googleapis.com/youtube/v3/videos?part=snippet&key=" + api_key + "&id=" + videoId;
                    video_updates["videoid"] = videoId;
                    $.get(url, function (data) {
                    })
                        .done(function (data) {
                            console.log(url);
                            //$('iframe').attr('src',"https://www.youtube.com/embed/"+ videoId); // +"?autoplay=1&enablejsapi=1");
                            player.loadVideoById(videoId, 0, "large");
                            player.seekTo(0);
                            title(data);
                            $("div.RV").css("display", "block");
                        })
                        .fail(function (data) {
                            if(data.status == 403){
                                alert("Sorry, my API quota reaches a maximum usage");
                            }
                            else{
                                alert("HTTP GET request fails \nPlease check your video link again.");
                            }
                            return;
                        });
        
                })
                .fail(function (data) {
                    console.log(data.status);
                    if(data.status == 403){
                        alert("Sorry, my API quota reaches a maximum usage");
                    }
                    else{
                        alert("HTTP GET request fails \nPlease check your video link again.");
                    }
                    return;
                });
        }
    })
}



function firstComment(data) {
    var firstCommentD = data.items[0].snippet.topLevelComment.snippet.textOriginal;
    var firstComment = data.items[0].snippet.topLevelComment.snippet.textDisplay;
    //console.log(firstCommentD);

    //console.log(firstComment);
    $("#result").text(firstComment);
    parsePlaylist(firstCommentD);
}
var title_val;
function title(data) {
    title_val = data.items[0].snippet.title;
    //console.log(title);
    $('#title').text(title_val);
    console.log("title" + title_val);
    video_updates["title"] = title_val;
    db.ref('videos/' + videoId).update(video_updates);
}

///brint the time. EX) 00:00 MUSE - Hysteria -> return 00:00
function string2time(data) {
    var time;
    try {
        var splitData = data.split(":");
    } catch (error) {
        updateError(error_url, "Pinned comment is not a timetable");
    }

    try {
        var len = splitData.length;
    } catch (error) {
        updateError(error_url, "Pinned comment is not a timetable");
    }
    if (len == 2) { //this means that the video is shorter than 1 hour
        if (splitData[0].includes("[")) {
            if (splitData[0].length == 2) {
                time = splitData[0].slice(-1) + ":" + splitData[1].slice(0, 2);
            }
            else {
                time = splitData[0].slice(-2) + ":" + splitData[1].slice(0, 2);
            }
        }
        else {
            time = splitData[0].slice(-2) + ":" + splitData[1].slice(0, 2);
        }
    }
    if (len == 3) { //this means that the video is longer than 1 hour
        time = splitData[0].slice(-2) + ":" + splitData[1] + ":" + splitData[2].slice(0, 2);
    }
    return time;
}

//bring a value for comparing. EX) 10:30 -> 10*60 + 30
function string2value(data) {
    var parseData = data.split(":");
    var len = parseData.length;
    if (len == 2) {
        return parseInt(parseData[0]) * 60 + parseInt(parseData[1]);
    }
    if (len == 3) {
        return parseInt(parseData[0]) * 3600 + parseInt(parseData[1]) * 60 + parseInt(parseData[2]);
    }
}

var timeArray = [];
var titleArray = [];

//this data is a pinned comment
function parsePlaylist(data) {
    var llist = data.split('\n');
    //console.log(llist);
    var len = llist.length;
    var firstLine;
    var videoLen;

    for (var i = 0; i < len; i++) { // to find where the timeline is started
        if (llist[i].includes("0:")) {
            firstLine = llist[i];
            break;
        }
    }

    for (var j = len - 1; j > 0; j--) {
        if (llist[j].includes(":")) {
            videoLen = llist[j];
            break;
        }
    }

    // memo:
    // In this case, index i and j contain the line of playlist
    // Use this!

    var startTime = string2time(firstLine);
    var endTime = string2time(videoLen);


    //check duplication
    var dup = 1;
    if (llist[i + 1].includes(startTime)) {
        dup++;
        if (llist[i + 2].includes(startTime)) {
            dup++;;
        }
    }
    console.log("dup", dup);


    var k;

    for (k = i; k < j + 1; k += dup) {
        if (llist[k].includes(":")) {
            timeArray.push(string2time(llist[k]));
        }
    }
    console.log(timeArray);
    videoLen = 0;
    for (k = i; k < j + 1; k += dup) {
        if (llist[k].includes(timeArray[videoLen])) {
            titleArray.push(llist[k].split(timeArray[videoLen])[1]);
            videoLen++;
        }
    }
    console.log(titleArray);

    //insertInPlaylist(timeArray, titleArray);
    insertInPlaylist(timeArray, titleArray);
}

function insertInPlaylist(timeArray, titleArray) {
    var len1 = timeArray.length;
    var len2 = titleArray.length;

    //if the length is different, there is an error in parsing 
    if (len1 != len2) {
        alert("Parse Error");
        console.log(timeArray);
        console.log(titleArray);
        updateError(error_url, "Prasing Error");
    }


    else{
        var i;
        // code for inserting a data to firebase (DW)
        video_updates["timeArray"] = timeArray;
        video_updates["titleArray"] = titleArray;
        //video_updates["t"] = document.getElementById('title').val();
        video_updates["status"] = true;
        var rel = [];
        relate_v = []; //initialize relate_v
        for(i=0;i<len1;i++){
            relate_v.push(0);
        }



        for (i = 0; i < len1; i++) {
            //$('#playlist_div').append("<span class = " +"first" + ">" + timeArray[i] + "</span>  <span>" +titleArray[i]+ "</span><br>");
            $('#playlist_div').append("<span class = \"M M" + i + "\">" + titleArray[i] + "<i class = \"M" + i + "\"></i>" + "</span>");
            timeDic["M" + i] = string2value(timeArray[i]);
        }
        load = 1;
        $("span." + nowPlaying[0]).css("background", "#d3d3d3");
        $("i." + nowPlaying[0]).html("<i class=\"far fa-play-circle\"></i>");
        inter = setInterval(changeNowPlaying, 1000, Object.values(timeDic));
        inter_state = 1;
        updateRelateVideo();
    }

}

$("div#playlist_div").on('click', "span", function (event) {
    //console.log("hi");
    //console.log(event.target);
    //console.log($(this).attr('class').slice(2));
    var time;
    if (nowPlaying[0] != (time = $(this).attr('class').slice(2))) {
        console.log(time);
        previous.push(nowPlaying[0]);
        click = 1;
        $("span." + nowPlaying[0]).css("background", "");
        $("i." + nowPlaying[0]).html("<i class=\"" + nowPlaying[0] + "\"></i>");
        nowPlaying[0] = time;
        time = timeDic[time];
        nowPlaying[1] = time;
        player.seekTo(time, true);
        $(this).css("background", "#d3d3d3");
        $("i." + nowPlaying[0]).html("<i class=\"far fa-play-circle\"></i>");
        updateRelateVideo();
    }
})

function whereAmI(current, timelist) {
    var len = timelist.length;
    for (var i = 0; i < len - 1; i++) {
        if ((timelist[i] <= current) && (current < timelist[i + 1])) {
            return [i, timelist[i]];
        }
    }
}

var tempp;

function changeNowPlaying(timelist) {
    //console.log(timelist.indexOf(nowPlaying[1]));
    //console.log(nowPlaying[1], nowPlaying);
    if (player.getPlayerState() == 1) { // running only playing state
        var time = player.getCurrentTime();
        //console.log("change");
        tempp = whereAmI(time, timelist);
        console.log(timelist.indexOf(nowPlaying[1]), tempp[0]);
        if (timelist.indexOf(nowPlaying[1]) != tempp[0]) {
            console.log("in if condition");
            if(repeat_1 && !click){ // if repeat one song is true
                player.seekTo(nowPlaying[1], true);
                click = 0;
            }
            else if(shuffle && !click){
                console.log("ssss");
                previous.push(nowPlaying[0]);
                $("span." + nowPlaying[0]).css("background", "");
                $("i." + nowPlaying[0]).html("<i class=\"" + nowPlaying[0] + "\"></i>");
                var k = pick_random();
                nowPlaying[0] = "M" + k;
                nowPlaying[1] = timelist[k];
                $("span." + nowPlaying[0]).css("background", "#d3d3d3");
                $("i." + nowPlaying[0]).html("<i class=\"far fa-play-circle\"></i>");
                player.seekTo(nowPlaying[1], true);
                updateRelateVideo();
                click = 0;
            }
            else{ // default action
                previous.push(nowPlaying[0]);
                $("span." + nowPlaying[0]).css("background", "");
                $("i." + nowPlaying[0]).html("<i class=\"" + nowPlaying[0] + "\"></i>");
                nowPlaying[0] = "M" + tempp[0];
                nowPlaying[1] = tempp[1];
                if(shuffle){
                    played[tempp[0]] = 1;
                }
                $("span." + nowPlaying[0]).css("background", "#d3d3d3");
                $("i." + nowPlaying[0]).html("<i class=\"far fa-play-circle\"></i>");
                updateRelateVideo();
                click = 0;
            }
            // below, basic funciton

        }
        click = 0;
    }
}

function updateRelateVideo() {
    
    //console.log(nowPlaying[0]);
    //console.log(nowPlaying[0].slice(1));

    var temp = encodeURI(titleArray[parseInt(nowPlaying[0].slice(1))].replace(/(\s*)/g, ""));
    temp.replace("]", "");

    var url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + temp + "&maxResults=2&type=video&key=" + api_key;
    var ind = parseInt(nowPlaying[0].slice(1));
    if(relate_v[ind] == 0){
        $.get(url, function (data) {
        })
            .done(function (data) {
                console.log(data);
                var new_videoId = data.items[0].id.videoId;
                //console.log(new_videoId);
                url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + temp + "&maxResults=4&type=video&key=" + api_key;
                $.get(url, function (data) {
                })
                    .done(function (data) {
                        var w = $("div.i" + 0).width();
                        for (var i = 0; i < 4; i++) {
                            $("img.i" + i).attr("src", data.items[i].snippet.thumbnails.medium.url);
                            $("span.i" + i).text(data.items[i].snippet.title);
                            $("img.i" + i).css("width", w - 1);
                            $("img.i" + i).css("height", (w * 9 / 16) - 1);
                            $("a.i" + i).attr("href", "https://www.youtube.com/watch?v=" + data.items[0].id.videoId);
                            $("a.i" + i).attr("target", "_blank");
                            $("img.i" + i).css("cursor", "pointer");
                        }
                        console.log($("#relate").html());
                        relate_v[ind] = $("#relate").html();
                    })
                    .fail(function (data) {
                        if(data.status == 403){
                            alert("Sorry, my API quota reaches a maximum usage");
                        }
                        else{
                            alert("HTTP GET request fails \nPlease check your video link again.");
                        }
                        return;
                    });
    
            })
            .fail(function (data) {
                if(data.status == 403){
                    alert("Sorry, my API quota reaches a maximum usage");
                }
                else{
                    alert("HTTP GET request fails \nPlease check your video link again.");
                }
                return;
            });
    }
    else{
        $("#relate").empty();
        $("#relate").append(relate_v[ind]);
    }

    //updateLyric();
}
$("span#lyric").on('click', function(event){
    updateLyric();
})

function updateLyric() {
    var temp = encodeURI(titleArray[parseInt(nowPlaying[0].slice(1))].replace(/(\s*)/g, ""));
    var url = "https://www.googleapis.com/customsearch/v1?key=" + api_key + "&cx=" + search_key + "&q=" + temp + "&num=2";
    $.get(url, function (data) {
    })
        .done(function (data) {
            console.log(data);
            url = data.items[0].formattedUrl;
                var openWin = window.open(url);

        })
        .fail(function (data) {
            alert("Sorry, I can't find a lyric of now Playing \n Please try again");
        });
}

$("div#control").on('click', "img", function (event) {
    var id = $(this).attr('id');
    switch (id) {
        case "repeat":
            if(repeat){
                $(this).attr("src", "img/repeat_b.png");
                repeat = 0;
            }
            else{
                $(this).attr("src", "img/repeat_r.png");
                repeat = 1;
            }
            break;
        case "repeat_1":
            if(repeat_1){
                $(this).attr("src", "img/repeat_1_b.png");
                repeat_1 = 0;
            }
            else{
                $(this).attr("src", "img/repeat_1_r.png");
                repeat_1 = 1;
            }
            break;
        case "shuffle":
            if(shuffle){
                $(this).attr("src", "img/shuffle_b.png");
                shuffle = 0;
            }
            else{
                $(this).attr("src", "img/shuffle_r.png");
                shuffle = 1;
                init_played();
                played[parseInt(nowPlaying[0].slice(1))] = 1;
            }
            break;
        default:
            break
    }
})
var played = [];
function init_played(){
    var len = timeArray.length;
    for(var i = 0 ; i<len ; i++){
        played.push(0);
    }
}

function pick_random(){
    var len = played.length;
    var ran;
    while(1){
        ran = Math.floor( Math.random() * len ); 
        if(!played[ran]){
            played[ran] = 1;
            return ran;  
        }
    }
}

function report(data){
    var openWin = window.open("Report.html?"+ error_url,"Reporting an Error page", "width=400, height=600, left = 100, top = 50");
}

function report_fb(){
    var new_key = db.ref().child('user_errors').push().key;

    var updates = {
        "error url ": location.href.split("html?")[1],
        "error message": document.getElementById('report').value
    }
    db.ref('user_errors/' + new_key).update({
        updates
    });
    alert("Report Success!");
    self.close();
}

$("i.fas").on('click', function (event) {
    var id = $(this).attr('id');
    switch (id) {
        case "prev":
            prev();
            break;
        case "next":
            next();
            break;
        default:
            break
    }
})

function prev(){
    var len = timeArray.length;
    if(nowPlaying[0] == "M0"){
        alert("First Song!");
    }    
    else{
        $("span." + nowPlaying[0]).css("background", "");
        $("i." + nowPlaying[0]).html("<i class=\"" + nowPlaying[0] + "\"></i>");
        prevv = previous.pop();
        nowPlaying[0] = prevv;
        nowPlaying[1] = timeDic[nowPlaying[0]];
        $("span." + nowPlaying[0]).css("background", "#d3d3d3");
        $("i." + nowPlaying[0]).html("<i class=\"far fa-play-circle\"></i>");
        player.seekTo(nowPlaying[1], true);
        updateRelateVideo();
    }

}

function next(){
    var len = timeArray.length;
    previous.push(nowPlaying[0]);
    if(shuffle){
        $("span." + nowPlaying[0]).css("background", "");
        $("i." + nowPlaying[0]).html("<i class=\"" + nowPlaying[0] + "\"></i>");
        var nextt = pick_random();
        nowPlaying[0] = "M" + nextt;
        nowPlaying[1] = timeDic[nowPlaying[0]];
        $("span." + nowPlaying[0]).css("background", "#d3d3d3");
        $("i." + nowPlaying[0]).html("<i class=\"far fa-play-circle\"></i>");
        player.seekTo(nowPlaying[1], true);

        updateRelateVideo();
    }
    else{  
        //if last song
        if(nowPlaying[0] == ("M" + len)){ 
            alert("Last Song!");
        }
        else{
            $("span." + nowPlaying[0]).css("background", "");
            $("i." + nowPlaying[0]).html("<i class=\"" + nowPlaying[0] + "\"></i>");
            var nextt = parseInt(nowPlaying[0].slice(1)) + 1;
            nowPlaying[0] = "M" + nextt;
            nowPlaying[1] = timeDic[nowPlaying[0]];
            //console.log("new", nowPlaying, timeDic);
            player.seekTo(nowPlaying[1], true);
            $("span." + nowPlaying[0]).css("background", "#d3d3d3");
            $("i." + nowPlaying[0]).html("<i class=\"far fa-play-circle\"></i>");
            updateRelateVideo();
        }
    }
}
