function getInitialTimeLineData(){
    getTimeLineDataForMetric("Count", "Sum", "123xx", timeLineBase.toISOString());
    getTimeLineDataForMetric("4XXError", "Sum", "4xx", timeLineBase.toISOString());
    getTimeLineDataForMetric("5XXError", "Sum", "5xx", timeLineBase.toISOString());
    getTimeLineDataForMetric("Latency", "Average", "Latency", timeLineBase.toISOString());
}

function getTimeLineData(){
    //Ensure time is exact
    var date = new Date();
    date.setMinutes(date.getMinutes() - 5);
    date.setSeconds(0);
    date.setMilliseconds(0);

    timeLineQueue["d:"+date.getDate()+" h:"+date.getHours()+" m:"+date.getMinutes()] = {};
    timeLineQueue["d:"+date.getDate()+" h:"+date.getHours()+" m:"+date.getMinutes()]["Latency"] = 0;
    timeLineQueue["d:"+date.getDate()+" h:"+date.getHours()+" m:"+date.getMinutes()]["4xx"] = 0;
    timeLineQueue["d:"+date.getDate()+" h:"+date.getHours()+" m:"+date.getMinutes()]["5xx"] = 0;
    timeLineQueue["d:"+date.getDate()+" h:"+date.getHours()+" m:"+date.getMinutes()]["123xx"] = 0;

    getTimeLineDataForMetric("Count", "Sum", "123xx", date.toISOString());
    getTimeLineDataForMetric("4XXError", "Sum", "4xx", date.toISOString());
    getTimeLineDataForMetric("5XXError", "Sum", "5xx", date.toISOString());
    getTimeLineDataForMetric("Latency", "Average", "Latency", date.toISOString());
}

function getTimeLineDataForMetric(metric, statistic, label, startTime){
    if(simulatorOn){
        return;
    }
    for(var gateway in inventory.apigateway){
        var dimension = {};
        dimension.Name = 'ApiName';
        dimension.Value = inventory.apigateway[gateway].name;

        var params = {
            MetricName: metric,
            Namespace: 'AWS/ApiGateway',
            Dimensions: [dimension],
            Period: 60 * 5, /* required */  //5 mins
            StartTime: startTime, /* required */
            EndTime: new Date().toISOString(), /* required */
            Statistics: [statistic]
        };

        for(var i=0; i<cloudWatchObjects.length; i++){
            if(label == "123xx"){
                timeLineInitialDataCountCalls++;
            }else if(label == "4xx"){
                timeLineInitialData4xxCalls++;
            }else if(label == "5xx"){
                timeLineInitialData5xxCalls++;
            }else if(label == "Latency"){
                timeLineInitialDataLatencyCalls++;
            }
            (function(metric, statistic, label){
                cloudWatchObjects[i].getMetricStatistics(params, function(err, data) {
                    var responses, calls, array;
                    if(label == "123xx"){
                        responses = ++timeLineInitialDataCountResponses;
                        calls = timeLineInitialDataCountCalls;
                        array = timeLineInitialDataCount;
                    }else if(label == "4xx"){
                        responses = ++timeLineInitialData4xxResponses;
                        calls = timeLineInitialData4xxCalls;
                        array = timeLineInitialData4xx;
                    }else if(label == "5xx"){
                        responses = ++timeLineInitialData5xxResponses;
                        calls = timeLineInitialData5xxCalls;
                        array = timeLineInitialData5xx;
                    }else if(label == "Latency"){
                        responses = ++timeLineInitialDataLatencyResponses;
                        calls = timeLineInitialDataLatencyCalls;
                        array = timeLineInitialDataLatency;
                    }

                    if (err) console.log(err, err.stack); // an error occurred
                    else{
                        if(data.Datapoints.length > 0){
                            if(label == "123xx"){
                                timeLineInitialDataCount = timeLineInitialDataCount.concat(data.Datapoints);
                                array = timeLineInitialDataCount;
                            }else if(label == "4xx"){
                                timeLineInitialData4xx = timeLineInitialData4xx.concat(data.Datapoints);
                                array = timeLineInitialData4xx;
                            }else if(label == "5xx"){
                                timeLineInitialData5xx = timeLineInitialData5xx.concat(data.Datapoints);
                                array = timeLineInitialData5xx;
                            }else if(label == "Latency"){
                                timeLineInitialDataLatency = timeLineInitialDataLatency.concat(data.Datapoints);
                                array = timeLineInitialDataLatency;
                            }
                        }

                        if(responses == calls){
                            var date;
                            for(var j=0; j<array.length; j++){
                                date = array[j].Timestamp;

                                if(date != undefined){
                                    date.setMinutes(date.getMinutes() - (date.getMinutes() - (Math.ceil(date.getMinutes()/5)*5)));
                                    if(timeLineQueue["d:"+date.getDate()+" h:"+date.getHours()+" m:"+date.getMinutes()] != undefined){
                                        timeLineQueue["d:"+date.getDate()+" h:"+date.getHours()+" m:"+date.getMinutes()][label] += array[j][statistic];
                                    }
                                }
                            }

                            timeLineCallBackCount++;
                            drawTimeLineGraph();
                        }
                    }
                });
            })(metric, statistic, label);
        }
    }
}

function convertDateToUTC(date) { 
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()); 
}