      var globe = new Globe();
      var googleMapsBaseUrl = "https://www.google.com/maps/embed/v1/place?key=AIzaSyBPTpMPp75gJyu0qx9cCJS6pBdFHeqA0NI";
      var rotate = true;
      var holdingShift = false;
      var holdingAlt = false;
      var inventory = {};
      var newConnectionQueue = {};
      var inventoryFields = ["health","status","cpu","tags","memory","disk"];
      var sortedInventoryCounts = [];
      var sortedTrafficCounts = [];
      var xhr;
      var eventListCount = 0;
      var eventsPane = document.getElementById("events");
      var eventsPaneContent = "";
      var donutGraphWidth = 2;
      var donutGraphRadius = 55;
      var donutGraphPadding = 5;
      // var donutGraphCanvasCpu = document.getElementById('cpuPercentageGraph');
      // var donutGraphTextCpu = document.getElementById('cpuPercentage');
      // var donutGraphContextCpu = donutGraphCanvasCpu.getContext('2d');
      // var donutGraphCanvasRam = document.getElementById('ramPercentageGraph');
      // var donutGraphTextRam = document.getElementById('ramPercentage');
      // var donutGraphContextRam = donutGraphCanvasRam.getContext('2d');
      // var donutGraphDisks = {};
      // var donutGraphCanvasHeightLarge = donutGraphCanvasCpu.clientHeight;
      // var donutGraphCanvasWidthLarge = donutGraphCanvasCpu.clientWidth;
      // var fillPercentActualCpu = 0;
      // var fillPercentActualRam = 0;
      var headerLeft = document.getElementById("headerLeft");
      var paneLeft = document.getElementById("paneLeft");
      var headerRight = document.getElementById("headerRight");
      var paneRight = document.getElementById("paneRight");
      var slideWidth = -headerLeft.clientWidth;
      var actualSlideWidth = slideWidth;
      var paneTop = document.getElementById("paneTop");
      var slideHeight = -paneTop.clientHeight;
      var actualSlideHeight = slideHeight;
      var sliding = false;
      var slideSpeed = 4;
      var slideDirection = "in";
      var slidingInterupt = false;
      var currentPaneObject = null;
      var trafficObjectIds = [];
      var trafficPointIds = [];
      var trafficCountAverage = 0;
      var trafficCountHigh = 0;
      var trafficConnectionCount = 0;
      var heatMapHistory = {};
      var heatMapTotal = 0;
      var heatMapHigh = 0;
      var heatMapAverage = 0;
      var frames = 0;
      var ipLookUpQueue = [];
      var ipMappings = {};
      var trafficQueue = [];
      var connectionDetailKeys = {};
      var trafficWindowSeconds = 300;
      var trafficVisibilitySeconds = 10;
      var startTime = new Date();
      startTime.setSeconds(startTime.getSeconds() - trafficVisibilitySeconds);
      startTime = startTime.getTime();
      var timeOffset = new Date().getTime() - startTime;
      var currentTime = startTime;
      var lastTrafficQueueClearTime = currentTime;
      var lastTrafficRefreshTime = currentTime;
      var trafficPerMinuteActual = 0;
      var uniqueIpPerMinuteActual = 0;
      var forceIpKeyRefresh = false;
      var ipLookUpsInProgress = {};
      var firstInventorySetLoaded = false;
      var ipGatewayLogRetrivalInProgress = false;
      var largeMapVisible = false;
      var simulatorOn = simulatorPaneVisible = true;
      var paneSimActivity = false;
      var simConnections = 500;
      var simUniqueIps = 15
      var sim4xxPercent = 10;
      var sim5xxPercent = 10;
      var nameFilter = "";
      var stageFilter = "";
      var criticalErrorRate = 25;
      var overallStatus = "success";
      var month = new Array();
      var movingGlobe = false;
      month[0] = "Jan";
      month[1] = "Feb";
      month[2] = "Mar";
      month[3] = "Apr";
      month[4] = "May";
      month[5] = "Jun";
      month[6] = "Jul";
      month[7] = "Aug";
      month[8] = "Sep";
      month[9] = "Oct";
      month[10] = "Nov";
      month[11] = "Dec";

      var color5xx = '#ff0000';
var color123 = "#ffffff";
var color4xx = "#d16606";
var timeLineFirstRun = true;

      var timeLineBase = new Date();
      timeLineBase.setHours(timeLineBase.getHours() - 24);
    timeLineBase.setMinutes(timeLineBase.getMinutes() - (timeLineBase.getMinutes() - (Math.ceil(timeLineBase.getMinutes()/5)*5)));
    timeLineBase.setSeconds(0);
    timeLineBase.setMilliseconds(0);

    //timeLineBaseAdjusted is for the timeline graph x axis only
    var timeLineBaseAdjusted = new Date(timeLineBase.getTime());
    timeLineBaseAdjusted.setMinutes(timeLineBaseAdjusted.getMinutes() + 5);

     var timeLineBaseDays = timeLineBase.getDate();
        var timeLineBaseHours = timeLineBase.getHours();
        var timeLineBaseMinutes = timeLineBase.getMinutes();

    var timeLineInitialDataCount = [];
var timeLineInitialDataCountCalls = 0;
var timeLineInitialDataCountResponses = 0;
var timeLineInitialData4xx = [];
var timeLineInitialData4xxCalls = 0;
var timeLineInitialData4xxResponses = 0;
var timeLineInitialData5xx = [];
var timeLineInitialData5xxCalls = 0;
var timeLineInitialData5xxResponses = 0;
var timeLineInitialDataLatency = [];
var timeLineInitialDataLatencyCalls = 0;
var timeLineInitialDataLatencyResponses = 0;
var timeLineQueue = {};
var timeLineCallBackCount = 0;

for(var m=0; m<287; m++){
    timeLineQueue["d:"+timeLineBaseDays+" h:"+timeLineBaseHours+" m:"+timeLineBaseMinutes] = {};
    timeLineQueue["d:"+timeLineBaseDays+" h:"+timeLineBaseHours+" m:"+timeLineBaseMinutes]["Latency"] = 0;
    timeLineQueue["d:"+timeLineBaseDays+" h:"+timeLineBaseHours+" m:"+timeLineBaseMinutes]["4xx"] = 0;
    timeLineQueue["d:"+timeLineBaseDays+" h:"+timeLineBaseHours+" m:"+timeLineBaseMinutes]["5xx"] = 0;
    timeLineQueue["d:"+timeLineBaseDays+" h:"+timeLineBaseHours+" m:"+timeLineBaseMinutes]["123xx"] = 0;

    //Check for end of minute
    if(timeLineBaseMinutes == 55){
        timeLineBaseMinutes = 0;
        if(timeLineBaseHours == 23){
            timeLineBaseHours = 0;
            timeLineBaseDays++;
        }else{
            timeLineBaseHours++;
        }
    }else{
        timeLineBaseMinutes += 5;
    }
}

      var testOnly = ["1.0.0.0","1.0.0.102","1.0.0.255","1.0.2.0","1.0.4.77","1.0.15.255","1.0.30.0",
        "1.0.100.100","1.0.255.255","1.1.0.1","1.1.1.1","1.1.3.4","2.1.8.55","2.1.60.12","2.1.65.102",
        "3.1.113.0","3.1.114.255","3.1.115.205","3.1.115.255","4.1.126.12","5.1.128.88","5.2.0.2","5.2.2.13","5.2.3.4","5.2.4.88","5.2.5.97"];