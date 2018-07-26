var timeLineGraph = new Rickshaw.Graph( {
    element: document.getElementById("timeLine"),
    renderer: 'multi',
    series: new Rickshaw.Series.FixedDuration([
        {
            name: '4xx',
            color: "#ff7b00",
            renderer: 'bar',
            unstack: true
        },
        {
            name: '5xx',
            color: color5xx,
            renderer: 'bar',
            unstack: true
        },
        { 
            name: '123xx',
            color: color123,
            renderer: 'bar',
            unstack: true 
        }
    ], undefined, {
        timeInterval: 5 * 60 * 1000,
        maxDataPoints: 288,
        timeBase: timeLineBaseAdjusted.getTime()/1000
    })
} );

var timeLineGraphLatency = new Rickshaw.Graph( {
    element: document.getElementById("timeLineLatency"),
    renderer: 'multi',
    series: new Rickshaw.Series.FixedDuration([
        { 
            name: 'Latency',
            color: '#00adef',
            renderer: 'line',
            strokeWidth: 1 
        },
        { 
            name: 'LatencyArea',
            color: 'rgba(0,133,199,0.2)',
            renderer: 'area'
        },
    ], undefined, {
        timeInterval: 5 * 60 * 1000,
        maxDataPoints: 288,
        timeBase: timeLineBaseAdjusted.getTime()/1000
    })
} );

var axesTime = new Rickshaw.Graph.Axis.Time( {
        graph: timeLineGraph,
    } );

axesTime.render();

var axes = new Rickshaw.Graph.Axis.Y( {
    graph: timeLineGraph,
    pixelsPerTick: 30,
    ticksTreatment: 'inverse'
} );
axes.render();

var hoverDetail = new Rickshaw.Graph.HoverDetail( {
	graph: timeLineGraph,
    yFormatter: function(y){return y;},
    xFormatter: function(x){return formatAMPM(new Date( x * 1000 )) + " (" + new Date( x * 1000 ).toUTCString() + ")";},
    formatter: function(series, x, y, formattedX, formattedY, d) {
        return null;
	}
} );

var hoverDetailLatency = new Rickshaw.Graph.HoverDetail( {
	graph: timeLineGraphLatency,
    yFormatter: function(y){return y;},
    xFormatter: function(x){return formatAMPM(new Date( x * 1000 )) + " (" + new Date( x * 1000 ).toUTCString() + ")";},
    formatter: function(series, x, y, formattedX, formattedY, d) {
        return null;
	}
} );

timeLineGraph.update();
timeLineGraphLatency.update();

function drawTimeLineGraph(){
    //Check to ensure all metrics have returned
    if(timeLineCallBackCount != 4){
        return;
    }

    if(timeLineFirstRun){
        timeLineBaseDays = timeLineBase.getDate();
        timeLineBaseHours = timeLineBase.getHours();
        timeLineBaseMinutes = timeLineBase.getMinutes();

        for(var m=0; m<287; m++){
            //Adjust since 123xx is holding total count
            timeLineQueue["d:"+timeLineBaseDays+" h:"+timeLineBaseHours+" m:"+timeLineBaseMinutes]["123xx"] = 
                timeLineQueue["d:"+timeLineBaseDays+" h:"+timeLineBaseHours+" m:"+timeLineBaseMinutes]["123xx"] - 
                (timeLineQueue["d:"+timeLineBaseDays+" h:"+timeLineBaseHours+" m:"+timeLineBaseMinutes]["4xx"] + 
                timeLineQueue["d:"+timeLineBaseDays+" h:"+timeLineBaseHours+" m:"+timeLineBaseMinutes]["5xx"]);

            var data = {}
            data["123xx"] = timeLineQueue["d:"+timeLineBaseDays+" h:"+timeLineBaseHours+" m:"+timeLineBaseMinutes]["123xx"];
            data["4xx"] = timeLineQueue["d:"+timeLineBaseDays+" h:"+timeLineBaseHours+" m:"+timeLineBaseMinutes]["4xx"];
            data["5xx"] = timeLineQueue["d:"+timeLineBaseDays+" h:"+timeLineBaseHours+" m:"+timeLineBaseMinutes]["5xx"];
            timeLineGraph.series.addData(data);

            data = {};
            data["Latency"] = timeLineQueue["d:"+timeLineBaseDays+" h:"+timeLineBaseHours+" m:"+timeLineBaseMinutes]["Latency"];
            data["LatencyArea"] = data["Latency"];
            timeLineGraphLatency.series.addData(data);

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
    }else{
        //It's overkill to use the timeLineQueue object, but it keeps the follow on load logic consistent with initial load

        var date = new Date();
        date.setMinutes(date.getMinutes() - 5);
        var days = date.getDate();
        var hours = date.getHours();
        var minutes = date.getMinutes();
        timeLineQueue["d:"+days+" h:"+hours+" m:"+minutes]["123xx"] = 
            timeLineQueue["d:"+days+" h:"+hours+" m:"+minutes]["123xx"] - 
            (timeLineQueue["d:"+days+" h:"+hours+" m:"+minutes]["4xx"] + 
            timeLineQueue["d:"+days+" h:"+hours+" m:"+minutes]["5xx"]);

        var data = {}
        data["123xx"] = timeLineQueue["d:"+days+" h:"+hours+" m:"+minutes]["123xx"];
        data["4xx"] = timeLineQueue["d:"+days+" h:"+hours+" m:"+minutes]["4xx"];
        data["5xx"] = timeLineQueue["d:"+days+" h:"+hours+" m:"+minutes]["5xx"];
        timeLineGraph.series.addData(data);

        data = {};
        data["Latency"] = timeLineQueue["d:"+days+" h:"+hours+" m:"+minutes]["Latency"];
        data["LatencyArea"] = data["Latency"];
        timeLineGraphLatency.series.addData(data);
    }

 
    timeLineGraph.update();
    timeLineGraphLatency.update();

    timeLineFirstRun = false;

    //Reset variables
    timeLineInitialDataCount = [];
    timeLineInitialDataCountCalls = 0;
    timeLineInitialDataCountResponses = 0;
    timeLineInitialData4xx = [];
    timeLineInitialData4xxCalls = 0;
    timeLineInitialData4xxResponses = 0;
    timeLineInitialData5xx = [];
    timeLineInitialData5xxCalls = 0;
    timeLineInitialData5xxResponses = 0;
    timeLineInitialDataLatency = [];
    timeLineInitialDataLatencyCalls = 0;
    timeLineInitialDataLatencyResponses = 0;
    timeLineQueue = {};
    timeLineCallBackCount = 0;
}