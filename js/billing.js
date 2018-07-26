function getBilling(){
    if(simulatorOn){
        globe.load("billing", ["2.50"]);
        return;
    }
    var dateOffset = 8*60*60*1000; //8 hours 
        
    var start = new Date();
    start.setTime(start.getTime() - dateOffset);

    var params = {
        MetricName: 'EstimatedCharges',
        Namespace: 'AWS/Billing',
        Dimensions: [
        {
            Name: 'Currency',
            Value: 'USD'
        }
        ],
        Period: 60, /* required */
        StartTime: start.toISOString(), /* required */
        EndTime: new Date().toISOString(), /* required */
        Statistics: ['Average']
    };

    cloudWatchObjects[0].getMetricStatistics(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     globe.load("billing", [data.Datapoints[0].Average]);
    });
}