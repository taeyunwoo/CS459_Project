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

//global variable
var videoId;
//var api_key = "AIzaSyAKwZDfEyLYuMjvMAeLmlyVFjlXMydwoZQ";
//var api_key = "AIzaSyAxXCc5NBtxIaAAruFiYCkcYmMrdF9uzFM" //mom
var api_key = "AIzaSyDkSfUzBfLdSnN6fGDN_A5Jze6NpqPYS5g";
var load = 0;
var nowPlaying = ["M0",0];
var timeDic = {};
var inter;
var inter_state = 0;

// for YouTube iframe API
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/player_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;

function onYouTubeIframeAPIReady(){
    player = new YT.Player('player',{
        width:'400',
        height: '300',
        videoId: 'gX4imVi8R6U',
        playerVars: {rel: 0},
        events: {
            'onReady' : onPlayerReady,
            'onStateChange' : onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    event.target.playVideo();
}

function onPlayerStateChange(event){
    console.log("state change");
    if(player.getPlayerState() != 1){
        inter_state = 0;
        clearInterval(inter);
    }
    if(player.getPlayerState() == 1 && !inter_state){
        clearInterval(inter);
        inter = setInterval(changeNowPlaying, 1000, Object.values(timeDic));
        inter_state = 1;
    }
}
// YouTube iframe API code end

$(document).keydown(function (key) { //1->49
    if (key.keyCode == 49) {
        console.log(player.getCurrentTime());
    }
    autoenter = 0;
});

$(document).ready(function(){
})




function bringData(){
    // if this page is reused
    if(load){
        document.getElementById("playlist_div").innerHTML = "";
    }
    var videoLink = $('#videoLink').val();
    
    if(videoLink == ""){
        alert("Please enter the YouTube Playlist Link!");
        return;
    }
    if(!videoLink.includes("v=")){
        alert("Your Link doesn't contain a 'videoID'. \n Please check your video Link.");
        return;
    }

    videoId = videoLink.split('v=');
    videoId = videoId[1].split('&')[0];
    //console.log(videoId);
    var url = "https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&key="+api_key+"&videoId="+videoId+"&maxResults=2";
    
    $.get(url, function(data){
    })
        .done(function(data){
            firstComment(data);
        })
        .fail(function(data){
            alert("HTTP GET request fails \nPlease check your video link again.")
            return;
        });

    url = "https://www.googleapis.com/youtube/v3/videos?part=snippet&key="+api_key+"&id="+videoId;
    $.get(url, function(data){
    })
        .done(function(data){
            //$('iframe').attr('src',"https://www.youtube.com/embed/"+ videoId); // +"?autoplay=1&enablejsapi=1");
            player.loadVideoById(videoId, 0, "large");
            player.seekTo(0);
            title(data);
            $("div.RV").css("display","block");
        })
        .fail(function(data){
            alert("HTTP GET request fails \nPlease check your video link again.")
            return;
        });

}



function firstComment(data){
    var firstCommentD = data.items[0].snippet.topLevelComment.snippet.textOriginal;
    var firstComment = data.items[0].snippet.topLevelComment.snippet.textDisplay;
    //console.log(firstCommentD);

    //console.log(firstComment);
    $("#result").text(firstComment);
    parsePlaylist(firstCommentD);
}

function title(data){
    var title = data.items[0].snippet.title;
    //console.log(title);
    $('#title').text(title);
}

///brint the time. EX) 00:00 MUSE - Hysteria -> return 00:00
function string2time(data){ 
    var time;
    var splitData = data.split(":");
    var len = splitData.length;
    if(len == 2){ //this means that the video is shorter than 1 hour
        if(splitData[0].includes("[")){
            if(splitData[0].length == 2){
                time = splitData[0].slice(-1) + ":" + splitData[1].slice(0,2);
            }
            else{
                time = splitData[0].slice(-2) + ":" + splitData[1].slice(0,2);
            }
        }
        else{
            time = splitData[0].slice(-2) + ":" + splitData[1].slice(0,2);
        }
    }
    if(len == 3){ //this means that the video is longer than 1 hour
        time = splitData[0].slice(-2) + ":" + splitData[1] + ":" + splitData[2].slice(0,2);
    }
    return time;
}

//bring a value for comparing. EX) 10:30 -> 10*60 + 30
function string2value(data){ 
    var parseData = data.split(":");
    var len = parseData.length;
    if(len == 2){
        return parseInt(parseData[0])*60 + parseInt(parseData[1]);
    }
    if(len == 3){
        return parseInt(parseData[0])*3600 + parseInt(parseData[1])*60 + parseInt(parseData[2]);
    }
}

var timeArray = [];
var titleArray = [];

//this data is a pinned comment
function parsePlaylist(data){ 
    var llist = data.split('\n');
    //console.log(llist);
    var len = llist.length;
    var firstLine;
    var videoLen;
    
    for(var i = 0 ; i<len ; i++){ // to find where the timeline is started
        if(llist[i].includes("0:")){
            firstLine = llist[i];
            break;
        }
    }
    
    for(var j = len-1 ; j>0 ; j--){
        if(llist[j].includes(":")){
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
    if(llist[i+1].includes(startTime)){
        dup++;
        if(llist[i+2].includes(startTime)){
            dup++;;
        }
    }
    //console.log(dup);


    var k;

    for(k = i ; k < j+1 ; k+=dup){
        if(llist[k].includes(":")){
            timeArray.push(string2time(llist[k]));
        }
    }

    console.log(timeArray);

    videoLen = 0;


    for(k = i ; k < j+1 ; k+=dup){
        if(llist[k].includes(timeArray[videoLen])){
            titleArray.push(llist[k].split(timeArray[videoLen])[1]);
            videoLen++;
        }
    }
    console.log(titleArray);

    //insertInPlaylist(timeArray, titleArray);
    insertInPlaylist(timeArray, titleArray);
}

function insertInPlaylist(timeArray, titleArray){
    var len1 = timeArray.length;
    var len2 = titleArray.length;

    //if the length is different, there is an error in parsing 
    if(len1 != len2){ 
        alert("Parse Error");
    }
    var i;
    
    for(i = 0 ; i<len1 ; i++){
        //$('#playlist_div').append("<span class = " +"first" + ">" + timeArray[i] + "</span>  <span>" +titleArray[i]+ "</span><br>");
        $('#playlist_div').append("<span class = \"M M"+ i +"\">" +titleArray[i]+ "<i class = \"M" + i+"\"></i>" +"</span>");
        timeDic["M" + i] = string2value(timeArray[i]);
    }
    load = 1;
    $("span." + nowPlaying[0]).css("background", "#d3d3d3");
    $("i." + nowPlaying[0]).html("<i class=\"far fa-play-circle\"></i>");
    inter = setInterval(changeNowPlaying, 1000, Object.values(timeDic));
    inter_state = 1;
    updateRelateVideo();
}

$("div#playlist_div").on('click',"span", function(event){
    //console.log("hi");
    //console.log(event.target);
    //console.log($(this).attr('class').slice(2));
    var time;
    if(nowPlaying[0] != (time = $(this).attr('class').slice(2))){
        $("span." + nowPlaying[0]).css("background", "");
        $("i." + nowPlaying[0]).html("<i class=\""+ nowPlaying[0] +"\"></i>");
        nowPlaying[0] = time;
        time = timeDic[time];
        nowPlaying[1] = time;
        player.seekTo(time, true); 
        $(this).css("background", "#d3d3d3");
        $("i." + nowPlaying[0]).html("<i class=\"far fa-play-circle\"></i>");
        updateRelateVideo();
    }

})

function whereAmI(current, timelist){
    var len = timelist.length;
    for (var i = 0 ; i<len-1 ; i++){
        if((timelist[i] <= current) && (current < timelist[i+1])){
            return [i,timelist[i]];
        }
    }
}

function changeNowPlaying(timelist){
    //console.log(timelist.indexOf(nowPlaying[1]));
    //console.log(nowPlaying[1], nowPlaying);
    if(player.getPlayerState() == 1){ // running only playing state
        var time = player.getCurrentTime();
        //console.log("change");
        var temp = whereAmI(time, timelist);
        if(timelist.indexOf(nowPlaying[1]) != temp[1]){
            $("span." + nowPlaying[0]).css("background", "");
            $("i." + nowPlaying[0]).html("<i class=\""+ nowPlaying[0] +"\"></i>");
            nowPlaying[0] = "M" + temp[0];
            nowPlaying[1] = temp[1];
            $("span." + nowPlaying[0]).css("background", "#d3d3d3");
            $("i." + nowPlaying[0]).html("<i class=\"far fa-play-circle\"></i>");
            updateRelateVideo();
        }
    }
}

function updateRelateVideo(){
    //console.log(nowPlaying[0]);
    //console.log(nowPlaying[0].slice(1));

    var temp = encodeURI(titleArray[parseInt(nowPlaying[0].slice(1))].replace(/(\s*)/g, ""));
    temp.replace("]","");

    var url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q="+ temp + "&maxResults=2&type=video&key=" + api_key;

    $.get(url, function(data){
    })
        .done(function(data){
            console.log(data);
            var new_videoId = data.items[0].id.videoId;
            //console.log(new_videoId);
            url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q="+ temp + "&maxResults=4&type=video&key=" + api_key;
            $.get(url, function(data){
            })
                .done(function(data){
                    var w = $("div.i"+0).width();
                    for(var i = 0; i<4 ;i++){
                       $("img.i"+i).attr("src", data.items[i].snippet.thumbnails.medium.url);
                       $("span.i"+i).text(data.items[i].snippet.title);
                       $("img.i"+i).css("width", w-1);
                       $("img.i"+i).css("height", (w*9/16)-1);
                       $("a.i"+i).attr("href", "https://www.youtube.com/watch?v="+data.items[0].id.videoId); 
                       $("a.i"+i).attr("target","_blank");
                       $("img.i"+i).css("cursor","pointer");
                    }
        
                })
                .fail(function(data){
                    alert("HTTP GET request fails \nPlease check your video link again.")
                    return;
                });

        })
        .fail(function(data){
            alert("HTTP GET request fails \nPlease check your video link again.")
            return;
        });

}
