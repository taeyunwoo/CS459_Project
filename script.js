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
    console.log(url);
    $.get(url, function(data){
        console.log(data);
    })
}