function translateElb(data){
    var translatedObject = {};
    translatedObject.id = data.LoadBalancerName;
    translatedObject.name = data.LoadBalancerName;
    translatedObject.status = "pending";

    if(data.Instances != undefined && data.Instances.length > 0){
        translatedObject.status = "running";
    }
    translatedObject.AvailabilityZone = data.AvailabilityZones[0];
    
    if(translatedObject.AvailabilityZone != undefined){
        translatedObject.Region = translatedObject.AvailabilityZone.substring(0, translatedObject.AvailabilityZone.length-1);
    }

    translatedObject.instances = data.Instances;
    translatedObject.tags = data.Tags;
    translatedObject.health = data.health;
    translatedObject.type = "elb";

    return translatedObject;
}

function translateApiGateway(data){
    var translatedObject = {};
    translatedObject.id = data.id;
    translatedObject.name = data.name;
    translatedObject.Region = data.region;
    translatedObject.Description = data.description;
    translatedObject.stages = data.stages;
    translatedObject.type = "apigateway";
    translatedObject.status = "running";

    return translatedObject;
}