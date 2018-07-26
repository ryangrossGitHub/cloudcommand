var timeLineGraphUpdated = false;
function startClock() {
    var now = new Date();
    currentTime = new Date(now.getTime() - timeOffset);
    document.getElementById('clock').innerHTML = currentTime.toUTCString() +
     " <span style='font-size:14px;'>(" + formatAMPM(currentTime) + ")</span>";

    //Load next frame of traffic
    if((currentTime.getTime() - lastTrafficQueueClearTime)/1000 >= trafficWindowSeconds){
        lastTrafficQueueClearTime = currentTime.getTime();
    }

    //Load next frame of traffic
    if(!ipGatewayLogRetrivalInProgress && (currentTime.getTime() - lastTrafficRefreshTime)/1000 >= trafficVisibilitySeconds){
        drawUpdates();
        console.log("drawing updates")
        if(simulatorOn){
            lookUpIpsInQueue();
        }else{
            console.log("getting logs")
            getLogs();
        }
    }

    //timeLineFirstRun ensures we wait for the initial load to finish
    if(!timeLineFirstRun && now.getMinutes() % 5 == 0){
        if(!timeLineGraphUpdated){ //Only do this once per 5 mins
            getTimeLineData();
            timeLineGraphUpdated = true;
        }
    }else if(timeLineGraphUpdated){ //Reset variable state
        timeLineGraphUpdated = false;
    }
    
    var t = setTimeout(startClock, 1000);
}
function padTimeWithZeros(i) {
    if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
    return i;
}