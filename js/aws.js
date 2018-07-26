var loginRegion = 'us-east-1';
var credentialExpirationDate;
var ipLookUpBatchLength = 100;
var lastMetricCall = 0;
var getAWSInventoryInterval = 1000 * 5; //5 seconds
var getAWSMetricsInterval = 1000 * 60 * 5; //5 mins
var getAWSLoggedMetricsInterval = 1000 * 60 * 1; //1 mins
var getAWSBillingInterval = 1000 * 60 * 60 * 6; //6 hours
var getAWSEC2TrafficInterval = 1000 * 5; //5 seconds
var initialLoad = true;
var baseUrl = "https://pqhzr7kno2.execute-api.us-east-1.amazonaws.com/dev/";
var ipLookUpUrl = "http://localhost:3000";

var a, s, t;
var s3, cloudWatchLogs, cloudWatchObjects, APIGatewayObjects;
var appAccountConf;

function authenticate(u, p){
    $.ajax({
        url: baseUrl,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ "u": u, "p": p }),
        dataType: 'json',
        success: function(data) {
            var response = JSON.parse(data);
            AWS.config.update({
                accessKeyId: response.userAccount.AccessKeyId,
                secretAccessKey: response.userAccount.SecretAccessKey,
                sessionToken: response.userAccount.SessionToken,
                region: loginRegion
            });

            s3 = new AWS.S3({ apiVersion: '2006-03-01' });
            cloudWatchLogs = new AWS.CloudWatchLogs({apiVersion: '2014-03-28'});

            APIGatewayObjects = [
                new AWS.APIGateway({apiVersion: '2015-07-09',region: 'us-east-1'}),      //N. Virginia
                new AWS.APIGateway({apiVersion: '2015-07-09',region: 'us-east-2'}),      //Ohio
                new AWS.APIGateway({apiVersion: '2015-07-09',region: 'us-west-1'}),      //N. California
                new AWS.APIGateway({apiVersion: '2015-07-09',region: 'us-west-2'}),      //Oregon
                new AWS.APIGateway({apiVersion: '2015-07-09',region: 'ca-central-1'}),   //Canada (Central)
                new AWS.APIGateway({apiVersion: '2015-07-09',region: 'eu-west-1'}),      //Ireland
                new AWS.APIGateway({apiVersion: '2015-07-09',region: 'eu-central-1'}),   //Frankfurt
                new AWS.APIGateway({apiVersion: '2015-07-09',region: 'eu-west-2'}),      //London
                new AWS.APIGateway({apiVersion: '2015-07-09',region: 'ap-northeast-1'}), //Tokyo
                new AWS.APIGateway({apiVersion: '2015-07-09',region: 'ap-northeast-2'}), //Seoul
                new AWS.APIGateway({apiVersion: '2015-07-09',region: 'ap-southeast-1'}), //Singapore
                new AWS.APIGateway({apiVersion: '2015-07-09',region: 'ap-southeast-2'}), //Syndney
                new AWS.APIGateway({apiVersion: '2015-07-09',region: 'ap-south-1'}),     //Mumbai
                new AWS.APIGateway({apiVersion: '2015-07-09',region: 'sa-east-1'})       //Sao Paulo
            ];

            cloudWatchObjects = [
                new AWS.CloudWatch({apiVersion: '2010-08-01',region: 'us-east-1'}),      //N. Virginia
                new AWS.CloudWatch({apiVersion: '2010-08-01',region: 'us-east-2'}),      //Ohio
                new AWS.CloudWatch({apiVersion: '2010-08-01',region: 'us-west-1'}),      //N. California
                new AWS.CloudWatch({apiVersion: '2010-08-01',region: 'us-west-2'}),      //Oregon
                new AWS.CloudWatch({apiVersion: '2010-08-01',region: 'ca-central-1'}),   //Canada (Central)
                new AWS.CloudWatch({apiVersion: '2010-08-01',region: 'eu-west-1'}),      //Ireland
                new AWS.CloudWatch({apiVersion: '2010-08-01',region: 'eu-central-1'}),   //Frankfurt
                new AWS.CloudWatch({apiVersion: '2010-08-01',region: 'eu-west-2'}),      //London
                new AWS.CloudWatch({apiVersion: '2010-08-01',region: 'ap-northeast-1'}), //Tokyo
                new AWS.CloudWatch({apiVersion: '2010-08-01',region: 'ap-northeast-2'}), //Seoul
                new AWS.CloudWatch({apiVersion: '2010-08-01',region: 'ap-southeast-1'}), //Singapore
                new AWS.CloudWatch({apiVersion: '2010-08-01',region: 'ap-southeast-2'}), //Syndney
                new AWS.CloudWatch({apiVersion: '2010-08-01',region: 'ap-south-1'}),     //Mumbai
                new AWS.CloudWatch({apiVersion: '2010-08-01',region: 'sa-east-1'})       //Sao Paulo
            ];

            appAccountConf = response.appAccount;
            loginAndLoadInventory();
        },
        error: function(e) {
            alert("error="+e);
        }
    });

    // loginAndLoadInventory();
}

function lookUpIpsInQueue(){
    var batch = [];
    console.log(ipLookUpQueue)
    for(var ip in ipLookUpQueue){
        if(ipLookUpsInProgress[ip] == undefined){
            ipLookUpsInProgress[ip] = {};
            batch.push(ip);
        }

        if(batch.length >= ipLookUpBatchLength){
            getIpInfo(batch);
            batch = [];
        }
    }

    //Left over partial batch
    if(batch.length > 0){
        getIpInfo(batch);
    }

    lastTrafficRefreshTime = new Date((new Date()).getTime() - timeOffset);
    ipGatewayLogRetrivalInProgress = false;
}

function addIpsFromDBtoMap(data, err){
    var attributes;
    var ipData;
    if(err == undefined){
        console.log(data)
        for(var ip in data){
            attributes = data[ip].split(",");

            ipMappings[ip] = {};
            ipMappings[ip].country = attributes[2].replace(/"/gi,'');
            ipMappings[ip].stateRegion = attributes[3].replace(/"/gi,'');
            ipMappings[ip].city = attributes[5].replace(/"/gi,'');
            ipMappings[ip].lat = attributes[7].replace(/"/gi,'');
            ipMappings[ip].lon = attributes[8].replace(/"/gi,'');

            //Populate traffic queue with lat and lon
            for(var q=0; q<trafficQueue.length; q++){
                for(var c=0; c<trafficQueue[q].connections.length; c++){
                    if(trafficQueue[q].connections[c].ip == ip && trafficQueue[q].connections[c].lat == undefined){
                        ipData = ipMappings[trafficQueue[q].connections[c].ip];
                        trafficQueue[q].connections[c].lat = ipData.lat;
                        trafficQueue[q].connections[c].lon = ipData.lon;
                        trafficQueue[q].connections[c].country = ipData.country;
                        trafficQueue[q].connections[c].stateRegion = ipData.stateRegion;
                        trafficQueue[q].connections[c].city = ipData.city;
                    }
                }
            }

            delete ipLookUpsInProgress[ip];
            delete ipLookUpQueue[ip];
        }
    }else{
        console.log(err, err.stack);
    }
}

function getIpInfo(ips){
    var body = {};
    body.ips = ips;
    body.token = "token";
    httpGetAsync(ipLookUpUrl, JSON.stringify(body), function(data){
        addIpsFromDBtoMap(JSON.parse(data));
    });
}

function httpGetAsync(theUrl, data, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("POST", theUrl, true); // true for asynchronous 
    xmlHttp.setRequestHeader("Content-Type", "application/json")
    xmlHttp.send(data);
}

function loginAndLoadInventory(){
    document.getElementById("mainOverlays").style.visibility = "visible";
    document.getElementById("loginOverlay").style.display = "none";

    globe.runLoginAnimation();
    slidePanes("in");

    setTimeout(function(){
        setTimeout(function(){
            setTimeout(function(){
                startClock();
                getLogs();
                drawUpdates();
            }, 500);
        }, 500);
    }, 1000);

    getBilling();
}

//Get Inventory
// function getAWSInvetory(){
//     var params = {
//         FunctionName: 'CentralSky_GetInventory',
//         InvocationType: 'RequestResponse',
//         Payload: JSON.stringify({"token":AWS.config.credentials.sessionToken})
//     };

//     lambda.invoke(params, function(err, data){
//         console.log(JSON.parse(data.Payload));

//         if(initialLoad){
//             getAWSMetrics();
//             getAWSLoggedMetrics();
//             getAWSEC2Traffic();
//             initialLoad = false;
//         }

//         globe.load("inventory", JSON.parse(data.Payload));

//         setTimeout(function(){
//             if(lambdaEnable == true){
//                 getAWSInvetory();
//             }
//         }, getAWSInventoryInterval);
//     });
// }

// function getAWSMetrics() {
//     var params = {
//         FunctionName: 'CentralSky_GetMetrics',
//         InvocationType: 'RequestResponse',
//         Payload: JSON.stringify({"token":AWS.config.credentials.sessionToken})
//     };

//     lambda.invoke(params, function(err, data){
//         console.log(JSON.parse(data.Payload));
//         globe.load("metrics", JSON.parse(data.Payload));

//         setTimeout(function(){
//             if(lambdaEnable == true){
//                 getAWSMetrics();
//             }
//         }, getAWSMetricsInterval);
//     });
// }

// function getAWSLoggedMetrics() {
//     var params = {
//         FunctionName: 'CentralSky_GetLoggedMetrics',
//         InvocationType: 'RequestResponse',
//         Payload: JSON.stringify({"token":AWS.config.credentials.sessionToken})
//     };

//     lambda.invoke(params, function(err, data){
//         console.log(JSON.parse(data.Payload));
//         globe.load("metrics", JSON.parse(data.Payload));

//         setTimeout(function(){
//             if(lambdaEnable == true){
//                 getAWSLoggedMetrics();
//             }
//         }, getAWSLoggedMetricsInterval);
//     });
// }

// function getAWSBilling() {
//     var params = {
//         FunctionName: 'CentralSky_GetBilling',
//         InvocationType: 'RequestResponse',
//         Payload: JSON.stringify({"token":AWS.config.credentials.sessionToken})
//     };

//     lambda.invoke(params, function(err, data){
//         globe.load("billing", [JSON.parse(data.Payload)]);

//         setTimeout(function(){
//             if(lambdaEnable == true){
//                 getAWSBilling();
//             }
//         }, getAWSBillingInterval);
//     });
// }

// function getAWSEC2Traffic() {
//     var params = {
//         FunctionName: 'CentralSky_GetConnections',
//         InvocationType: 'RequestResponse',
//         Payload: JSON.stringify({"token":AWS.config.credentials.sessionToken})
//     };

//     lambda.invoke(params, function(err, data){
//         console.log(JSON.parse(data.Payload));

//         //Clear old traffic objects
//         for(var i=0; i<trafficObjectIds.length; i++){
//             globe.scene.remove(globe.scene.getObjectByName(trafficObjectIds[i]));
//         }

//         trafficObjectIds = [];

//         for(var i=0; i<trafficPointIds.length; i++){
//             globe.scene.remove(globe.scene.getObjectByName(trafficPointIds[i]));
//         }

//         trafficPointIds = [];

//         globe.load("traffic", JSON.parse(data.Payload));

//         setTimeout(function(){
//             if(lambdaEnable == true){
//                 getAWSEC2Traffic();
//             }
//         }, getAWSEC2TrafficInterval);
        
//     });
// }

// function blockIp(){
//     var ip = document.getElementById("trafficIp").innerHTML;
//     ip = ip.substring(ip.indexOf(">")+1, ip.indexOf("</")).trim();
//     var params = {
//         FunctionName: 'CentralSky_BlockConnection',
//         InvocationType: 'RequestResponse',
//         Payload: JSON.stringify({"ip":ip,"token":AWS.config.credentials.sessionToken})
//     };

//     lambda.invoke(params, function(err, data){
//         console.log(JSON.parse(data.Payload));

//         if(JSON.parse(data.Payload) == null){
//             console.log(ip + " blocked!")
//         }
//     });
// }