var videoId;
var api_key = "AIzaSyCqugvN_HgNqIhCn80iC2mS4nEFtiPtaLw";


$(document).ready(function(){

})

function bringData(){
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
            $('iframe').attr('src',"https://www.youtube.com/embed/"+videoId);
            title(data);
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

function string2time(data){ //brint the time. EX) 00:00 MUSE - Hysteria -> return 00:00
    var time;
    var splitData = data.split(":");
    var len = splitData.length;
    if(len == 2){ //this means that the video is shorter than 1 hour
        time = splitData[0].slice(-2) + ":" + splitData[1].slice(0,2);
    }
    if(len == 3){ //this means that the video is longer than 1 hour
        time = splitData[0].slice(-2) + ":" + splitData[1] + ":" + splitData[2].slice(0,2);
    }
    return time;
}

function string2value(data){ //bring a value for comparing. EX) 10:30 -> 10*60 + 30
    var parseData = data.split(":");
    var len = parseData.length;
    if(len == 2){
        return parseInt(data[0])*60 + parseInt(data[1]);
    }
    if(len == 3){
        return parseInt(data[0])*3600 + parseInt(data[1])*60 + parseInt(data[2]);
    }
}

function parsePlaylist(data){ //this data is a pinned comment
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
    var timeArray = [];

    for(k = i ; k < j+1 ; k+=dup){
        if(llist[k].includes(":")){
            timeArray.push(string2time(llist[k]));
        }
    }

    console.log(timeArray);

    videoLen = 0;

    var titleArray = [];
    for(k = i ; k < j+1 ; k+=dup){
        if(llist[k].includes(timeArray[videoLen])){
            titleArray.push(llist[k].split(timeArray[videoLen])[1]);
            videoLen++;
        }
    }
    console.log(titleArray);

}
