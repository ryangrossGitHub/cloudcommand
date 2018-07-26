function getElbLogs(bucket, accountId, parentDir, region, date){
    var start = new Date(date.getTime());
    start.setSeconds(start.getSeconds() - 60);
    var end = date;

    var prefix = parentDir + "AWSLogs/" + accountId + "/elasticloadbalancing";
    prefix = prefix + "/" + region + "/" + start.getUTCFullYear();
    prefix = prefix + "/" + ("0" + (start.getUTCMonth() + 1)).slice(-2);
    prefix = prefix + "/" + ("0" + start.getUTCDate()).slice(-2);

    var params = {
        Bucket: bucket, /* required */
        Prefix: prefix,
    };
    s3.listObjectsV2(params, function(err, data) {
        if (err) findNewElbRecords(null, err); // an error occurred
        else     findNewElbRecords(data, null, start, end, bucket);           // successful response
    });
}

function parseElbContents(data, start){
    var logs = data.split("\r\n");
    var log = null;
    var id = null;
    var connection = null;
    var connectionIp = null;

    //Classic ELB
    //timestamp elb client:port backend:port request_processing_time backend_processing_time response_processing_time elb_status_code backend_status_code received_bytes sent_bytes "request" "user_agent" ssl_cipher ssl_protocol
    
    //App ELB
    //type timestamp elb client:port target:port request_processing_time target_processing_time response_processing_time elb_status_code target_status_code received_bytes sent_bytes "request" "user_agent" ssl_cipher ssl_protocol target_group_arn trace_id

    for(var i=0; i<logs.length; i++){
        connection = null;
        connectionIp = null;
        if(logs[i].substring(0, 4) == start.getFullYear().toString()){  //Classic ELB
            log = convertLogToArray(logs[i]);
            
            var id = log[1];
            for(var r=0; r<trafficQueue.length; r++){
                if(trafficQueue[r].id == id){
                    connection = trafficQueue[r];
                    break;
                }
            }                        

            if(connection == null){
                connection = {};
                connection.type = "elb";
                connection.id = id;
                connection.connections = [];
                trafficQueue.push(connection);
            }

            var ip = log[2].split(":")[0];
            for(var c=0; c<connection.connections.length; c++){
                if(connection.connections[c].ip == ip){
                    connectionIp = connection.connections[c];
                    break;
                }
            }

            if(connectionIp == null){
                connectionIp = {};
                connectionIp.ip = ip;
                connectionIp.lat = 30;
                connectionIp.lon = 30;
                connectionIp.details = [];
                connection.connections.push(connectionIp);

                //Avoid duplicates
                if(ipMappings[ip] == undefined){
                    ipMappings[ip] = {};
                    ipLookUpQueue.push(ip);
                }
            }

            var details = {};
            details.time = log[0];
            details.targetIp = log[3].split(":")[0];
            details.requestTime = log[4];
            details.backendTime = log[5];
            details.responseTime = log[6];
            details.responseCode = log[7];
            details.targetResponse = log[8];
            details.url = log[11];
            details.userAgent = log[12];
            
            details.port = details.url.split(" ")[1];
            var indexOfPortStart = getPosition(details.port, ":", 2);
            details.port = details.port.substring(indexOfPortStart+1, details.port.indexOf("/", indexOfPortStart));

            connectionIp.details.push(details);
        }else if(logs[i].substring(0, 4) == "http" || logs[i].substring(0, 2) == "h2" || logs[i].substring(0, 2) == "ws"){   //App ELB
            log = convertLogToArray(logs[i]);
            
            var id = log[2];
            for(var r=0; r<trafficQueue.length; r++){
                if(trafficQueue[r].id == id){
                    connection = trafficQueue[r];
                    break;
                }
            }                        

            if(connection == null){
                connection = {};
                connection.type = "elb";
                connection.id = id;
                connection.connections = [];
                trafficQueue.push(connection);
            }

            var ip = log[3].split(":")[0];
            for(var c=0; c<connection.connections.length; c++){
                if(connection.connections[c].ip == ip){
                    connectionIp = connection.connections[c];
                    break;
                }
            }

            if(connectionIp == null){
                connectionIp = {};
                connectionIp.ip = ip;
                connectionIp.lat = 30;
                connectionIp.lon = 30;
                connectionIp.details = [];
                connection.connections.push(connectionIp);

                //Avoid duplicates
                if(ipMappings[ip] == undefined){
                    ipMappings[ip] = {};
                    ipLookUpQueue.push(ip);
                }
            }

            var details = {};
            details.time = log[1];
            details.targetIp = log[4].split(":")[0];
            details.requestTime = log[5];
            details.backendTime = log[6];
            details.responseTime = log[7];
            details.responseCode = log[8];
            details.targetResponse = log[9];
            details.url = log[12];
            details.userAgent = log[13];
            
            details.port = details.url.split(" ")[1];
            var indexOfPortStart = getPosition(details.port, ":", 2);
            details.port = details.port.substring(indexOfPortStart+1, details.port.indexOf("/", indexOfPortStart));

            connectionIp.details.push(details);
        }else{
            //Looks like this is not an elb log
            break;
        }
    }
}

function convertLogToArray(input){
    var myRegexp = /[^\s"]+|"([^"]*)"/gi;
    var myString = input;
    var myArray = [];
    
    do {
        //Each call to exec returns the next regex match as an array
        var match = myRegexp.exec(myString);
        if (match != null)
        {
            //Index 1 in the array is the captured group if it exists
            //Index 0 is the matched text, which we use if no captured group exists
            myArray.push(match[1] ? match[1] : match[0]);
        }
    } while (match != null);
    
    return myArray;
}

function getPosition(string, subString, index) {
    return string.split(subString, index).join(subString).length;
}

function getElbLogEvents(data, zipped, err, start){
    var logs = "";
    if(err == undefined){
        if(zipped){
            logs = new TextDecoder("utf-8").decode(new Zlib.Gunzip(data.Body).decompress());
        }else{
            logs = data.Body.toString('utf8');                
        }

        parseElbContents(logs, start);
    }else{
        console.log(err, err.stack);
    }
}

function findNewElbRecords(data, err, start, end, bucket){
    if(err == undefined){
        var zipped = false;
        var datestamp = start.getUTCFullYear() + ("0" + (start.getUTCMonth() + 1)).slice(-2) + ("0" + start.getUTCDate()).slice(-2);
        var timestamp = "";
        var datestampIndex = 0;
        var date = null;
        for(var i=0; i<data.Contents.length; i++){
            if(data.Contents[i].Size > 0){
                zipped = false;
                datestampIndex = data.Contents[i].Key.indexOf(datestamp+"T");
                timestamp = data.Contents[i].Key.substring(datestampIndex, data.Contents[i].Key.indexOf("Z", datestampIndex));
                
                //Convert elb time stamp to iso
                date = new Date(start.getUTCFullYear() + '-' + ("0" + (start.getUTCMonth() + 1)).slice(-2) + '-' +
                    ("0" + start.getUTCDate()).slice(-2) + 'T' + timestamp.substring(9, 11) + ':' +
                    timestamp.substring(11, 13) + ':00Z');

                if(date.getTime() > start.getTime() && date.getTime() < end.getTime()){
                    if(data.Contents[i].Key.substring(data.Contents[i].Key.length-3, data.Contents[i].Key.length) == ".gz"){
                        zipped = true;
                    }

                    (function(key, zipped, bucket){
                        var params = {
                            Bucket: bucket, /* required */
                            Key: key /* required */
                        };
                        s3.getObject(params, function(err, data) {
                            if (err) getElbLogEvents(null, null, err); // an error occurred
                            else     getElbLogEvents(data, zipped, null, start);           // successful response
                        });
                    })(data.Contents[i].Key, zipped, bucket);
                }
            }
        }
    }else{
        console.log(err, err.stack);
        //context.done(null, null);
    }
}