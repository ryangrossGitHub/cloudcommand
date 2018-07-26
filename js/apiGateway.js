var apiGatewayCloudWatchLogsPrefix = "API-Gateway-Execution-Logs_";
var apiGatewayObjectTarget = 0;
var apiGatewayObjectActual = 0;
var apiGatewayStagesTarget = 0;
var apiGatewayStagesActual = 0;
var apiGatewayLogGroupTarget = 0;
var apiGatewayLogGroupActual = 0;
var apiGatewayConnectionTarget = 0;
var apiGatewayConnectionActual = 0;
var apiGatewayInventoryQueue = {};

function getApiGatewayLogs(date){
    if(simulatorOn){
        return;
    }
    ipGatewayLogRetrivalInProgress = true;

    apiGatewayObjectTarget = APIGatewayObjects.length;
    apiGatewayObjectActual = 0;
    apiGatewayStagesTarget = 0;
    apiGatewayStagesActual = 0;
    apiGatewayLogGroupTarget = 0;
    apiGatewayLogGroupActual = 0;
    apiGatewayConnectionTarget = 0;
    apiGatewayConnectionActual = 0;

    var start = new Date(date.getTime());
    start.setSeconds(start.getSeconds() - trafficWindowSeconds);
    var end = date;
    
    var params = {};
    for(var i=0; i<APIGatewayObjects.length; i++){
        (function(APIGatewayObject){
            APIGatewayObject.getRestApis(params, function(err, data) {
                if (err) apigatewayGetStages(null, null, err); // an error occurred
                else     apigatewayGetStages(data, APIGatewayObject);           // successful response
            });
        })(APIGatewayObjects[i]);
    }

    function apigatewayGetStages(data, APIGatewayObject, err){
        if(err == undefined){
            for(var i=0; i<data.items.length; i++){
                (function(apiGateway, APIGatewayObject){
                    var newApiGateway = {};
                    newApiGateway.id = apiGateway.id;
                    newApiGateway.name = apiGateway.name;
                    newApiGateway.description = apiGateway.description;
                    newApiGateway.region = APIGatewayObject.config.region;
                    newApiGateway.type = "apigateway";
                    newApiGateway.cloud = "aws";
                    newApiGateway.stages = [];

                    apiGatewayInventoryQueue[apiGateway.id] = newApiGateway;

                    apiGatewayStagesTarget++;
                    var params = {
                        restApiId: apiGateway.id /* required */
                    };
                    APIGatewayObject.getStages(params, function(err, data) {
                        if (err) apigatewayListBuilderCallback(null, null, err); // an error occurred
                        else     apigatewayListBuilderCallback(data, apiGateway.id);           // successful response
                    });
                })(data.items[i], APIGatewayObject);
            }
        }else{
            console.log(err, err.stack);
        }

        apiGatewayObjectActual++;

        if(areApiGatewayLogsRetrieved()){
            loadApiGatewayInventory();
            lookUpIpsInQueue();
        }
    }

    function apigatewayListBuilderCallback(data, apiGatewayId, err){
        if(err == undefined){
            for(var i=0; i<data.item.length; i++){
                //Push inventory regardless of traffic filter
                apiGatewayInventoryQueue[apiGatewayId].stages.push(data.item[i].stageName);
                if(!isDeviceFilteredOut(apiGatewayId+"/"+data.item[i].stageName)){
                    getLogData(apiGatewayId, data.item[i].stageName);
                }
            }
        }else{
            console.log(err, err.stack);
        }

        apiGatewayStagesActual++;

        if(areApiGatewayLogsRetrieved()){
            loadApiGatewayInventory();
            lookUpIpsInQueue();
        }
    }

    function getLogData(apiGatewayId, stageName, token){
        var logGroupName = apiGatewayCloudWatchLogsPrefix + apiGatewayId + "/" + stageName;
        apiGatewayConnectionTarget++;

        var params = {
            logGroupName: logGroupName, /* required */
            endTime: end.getTime(),
            filterPattern: 'Method - Starting - HTTP - path - query - body - Endpoint - Execution - response',
            interleaved: false,
            limit: 10000,
            startTime: start.getTime()
        };
        cloudWatchLogs.filterLogEvents(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     getConnections(logGroupName, data);           // successful response
        });
    }
}
    
function getConnections(logGroupName, data){
    console.log("getting connections")
    console.log(data);
    var connection = {};
    connection.type = "apiGateway";
    connection.id = logGroupName.substring(apiGatewayCloudWatchLogsPrefix.length, logGroupName.length);
    for(var x=0; x<trafficQueue.length; x++){
        if(trafficQueue[x].id == connection.id){
            connection = trafficQueue[x];
            break;
        }
    }

    if(connection.connections == undefined){
        connection.connections = []; //New connections
        connection.responses = [];  //The last part of a connection started from a previous request
        trafficQueue.push(connection);
    }
    
    var message = "";
    var requestId = "";
    var port, tablet, mobile, smartTV, desktop, language, ip;
    var logDetails = {};
    
    for(var i=0; i<data.events.length; i++){
        message = data.events[i].message;
        requestId = message.substring(1, message.indexOf(")"));

        if(message.indexOf("Method request headers:") != -1){
            logDetails[requestId] = {};
            logDetails[requestId].id = requestId;
            logDetails[requestId].start = data.events[i].timestamp;

            ip = message.substring(message.indexOf("X-Forwarded-For=") + 1 + "X-Forwarded-For".length, message.length);
            ip = ip.substring(0, ip.indexOf(",")); //The first ip is the requester. Also ensures we get the port even if the order of params change
            console.log(ip)
            logDetails[requestId].ip = ip;

            port = message.substring(message.indexOf("X-Forwarded-Port=") + "X-Forwarded-Port=".length, message.length);
            port = port.substring(0, port.indexOf(",")); //Ensures we get the port even if the order of params change
            logDetails[requestId].port = port;

            tablet = message.substring(message.indexOf("CloudFront-Is-Tablet-Viewer=") + "CloudFront-Is-Tablet-Viewer=".length, message.length);
            tablet = tablet.substring(0, tablet.indexOf(","));
            logDetails[requestId].tablet = tablet;

            mobile = message.substring(message.indexOf("CloudFront-Is-Mobile-Viewer=") + "CloudFront-Is-Mobile-Viewer=".length, message.length);
            mobile = mobile.substring(0, mobile.indexOf(","));
            logDetails[requestId].mobile = mobile;

            smartTV = message.substring(message.indexOf("CloudFront-Is-SmartTV-Viewer=") + "CloudFront-Is-SmartTV-Viewer=".length, message.length);
            smartTV = smartTV.substring(0, smartTV.indexOf(","));
            logDetails[requestId].smartTV = smartTV;

            language = message.substring(message.indexOf("Accept-Language=") + "Accept-Language=".length, message.length);
            language = language.substring(0, language.indexOf(","));
            logDetails[requestId].language = language;

            logDetails[requestId].desktop = message.substring(message.indexOf("CloudFront-Is-Desktop-Viewer=") + "CloudFront-Is-Desktop-Viewer=".length, message.length-1);

            logDetails[requestId].userAgent = message.substring(message.indexOf("User-Agent=") + "User-Agent=".length, message.indexOf(", X-Forwarded-Proto"));
        }else if(message.indexOf("Method completed with status:") != -1){
            //Handle the case where start message was cut off before this reqest (this gets us close)
            if(logDetails[requestId] == undefined){
                logDetails[requestId] = {};
                logDetails[requestId].id = requestId;
            }

            logDetails[requestId].responseCode = message.substring(message.indexOf("Method completed with status:") + "Method completed with status:".length+1, message.length);
            logDetails[requestId].end = data.events[i].timestamp;
        }
    }

    var connectionIp = null;
    for(var d in logDetails){
        connectionIp = null;
        //Ensure every record at least has an ip, response, start time, and end time
        if(logDetails[d].ip != undefined && logDetails[d].responseCode != undefined &&
            logDetails[d].start != undefined && logDetails[d].end != undefined){
            for(var c=0; c<connection.connections.length; c++){
                if(connection.connections[c].ip == logDetails[d].ip){
                    connectionIp = connection.connections[c];
                    break;
                }
            }

            if(connectionIp == null){
                connectionIp = {};
                connectionIp.ip = logDetails[d].ip;
                connectionIp.details = [];

                //Avoid duplicates
                var locationData = ipMappings[logDetails[d].ip];
                console.log(locationData)
                if(locationData == undefined){
                    if(ipLookUpQueue[logDetails[d].ip] == undefined){
                        //Queue if not already queued
                        ipLookUpQueue[logDetails[d].ip] = {};
                    }
                }else{
                    connectionIp.lat = locationData.lat;
                    connectionIp.lon = locationData.lon;
                    connectionIp.country = locationData.country;
                    connectionIp.stateRegion = locationData.stateRegion;
                    connectionIp.city = locationData.city;
                }

                connection.connections.push(connectionIp);
            }

            //Avoid duplicate details
            if(connectionDetailKeys[connection.id+"|"+connection[logDetails[d].ip]+"|"+logDetails[d].start] != undefined){
                logDetails[d].processed = true
            }

            connectionIp.details.push(logDetails[d]);
            connectionDetailKeys[connection.id+"|"+connection[logDetails[d].ip]+"|"+logDetails[d].start] = {};
        }
    }

    apiGatewayConnectionActual++;

    if(areApiGatewayLogsRetrieved()){
        loadApiGatewayInventory();
        lookUpIpsInQueue();
    }
}

function areApiGatewayLogsRetrieved(){
    if(apiGatewayObjectTarget == apiGatewayObjectActual && apiGatewayStagesTarget == apiGatewayStagesActual && 
        apiGatewayConnectionTarget == apiGatewayConnectionActual){
        return true;
    }else{
        return false;
    }
}

function loadApiGatewayInventory(){
    var apiGatewayLoadArray = [];
    for(var apiGateway in apiGatewayInventoryQueue){
        for(var i=0; i<apiGatewayInventoryQueue[apiGateway].stages.length; i++){
            if(inventory.apigateway != undefined){
                if(inventory.apigateway[apiGateway + "/" + apiGatewayInventoryQueue[apiGateway].stages[i]] != undefined){
                    continue;
                }
            }

            //rename to show individual stages on globe
            var newObject = JSON.parse(JSON.stringify(apiGatewayInventoryQueue[apiGateway]));
            newObject.id = apiGateway + "/" + apiGatewayInventoryQueue[apiGateway].stages[i];
            apiGatewayLoadArray.push(newObject);

            var scatterCircleGraphObject = {};
            scatterCircleGraphObject.len = 100;
            scatterCircleGraphObject.color = "#00adef";
            scatterCircleGraphObject.id = newObject.id;
            scatterCircleGraphObject.label = newObject.name + " (" + apiGatewayInventoryQueue[apiGateway].stages[i] + ")";
            scatterCircleGraphInstanceArray.push(scatterCircleGraphObject);
        }
    }

    apiGatewayInventoryQueue = [];
    
    if(apiGatewayLoadArray.length > 0){
        globe.load("inventory", apiGatewayLoadArray);
        startScatterGraphAnimations();
    }
}