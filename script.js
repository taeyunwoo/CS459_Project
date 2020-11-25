var videoId;
var api_key = "AIzaSyCqugvN_HgNqIhCn80iC2mS4nEFtiPtaLw";


$(document).ready(function(){

})

function bringData(){
    var videoLink = $('#videoLink').val();
    videoId = videoLink.split('v=');
    videoId = videoId[1].split('&')[0];
    //console.log(videoId);
    var url = "https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&key="+api_key+"&videoId="+videoId+"&maxResults=2";
    $.get(url, function(data){
        console.log(url);
        firstComment(data);
    })
    url = "https://www.googleapis.com/youtube/v3/videos?part=snippet&key="+api_key+"&id="+videoId;
    $.get(url, function(data){
        //console.log(data);
        title(data);
    })
    $('iframe').attr('src',"https://www.youtube.com/embed/"+videoId);
}

function firstComment(data){
    var firstCommentD = data.items[0].snippet.topLevelComment.snippet.textOriginal;
    var firstComment = data.items[0].snippet.topLevelComment.snippet.textDisplay;
    console.log(firstCommentD);

    console.log(firstComment);
    $("#result").text(firstComment);
    parsePlaylist(firstCommentD);
}

function title(data){
    var title = data.items[0].snippet.title;
    //console.log(title);
    $('#title').text(title);
}

function parsePlaylist(data){ //this data is a pinned comment
    var llist = data.split('\n');
    console.log(llist);

}