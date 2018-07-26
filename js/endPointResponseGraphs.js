var endPointResponseObjects = [];
var endPointResponseUpdatedObjects = {};
var endPointTimeLineGraphs = {};
var endPointTimeLineResponseTimeGraphs = {};
var endPointDataFrames = 50;
var endPointGraphsMax = 6;

var endPointResponseGraphWidth = 100,
    endPointResponseGraphHeight = 60,
	endPointResponseGraphRadius = Math.min(endPointResponseGraphWidth, endPointResponseGraphHeight) / 2;

var endPointResponseGraphPie = d3.layout.pie()
	.sort(null)
	.value(function(d) {
		return d.value;
	});

var endPointResponseGraphArc = d3.svg.arc()
	.outerRadius(endPointResponseGraphRadius * 0.7)
    .innerRadius(endPointResponseGraphRadius * 0.65);

var endPointResponseGraphArcMiddle = d3.svg.arc()
	.outerRadius(endPointResponseGraphRadius * 0.65)
    .innerRadius(endPointResponseGraphRadius * 0.4);

var endPointResponseGraphArcInner = d3.svg.arc()
	.outerRadius(endPointResponseGraphRadius * 0.35)
    .innerRadius(endPointResponseGraphRadius * 0.3);
    
var endPointResponseGraphColorInner = d3.scale.ordinal()
    .domain(["123", "4xx", "5xx"])
    .range(["rgba(256,256,256,0.5)", "rgba(209, 102, 6,0.6)", "rgba(256,0,0,0.5)"]);

var endPointResponseGraphColorMiddle = d3.scale.ordinal()
    .domain(["123", "4xx", "5xx"])
    .range(["rgba(256,256,256,0.7)", "rgba(209, 102, 6,0.8)", "rgba(256,0,0,0.7)"]);

var endPointResponseGraphColorOutter = d3.scale.ordinal()
    .domain(["123", "4xx", "5xx"])
    .range(["rgba(256,256,256,1)", "rgba(209, 102, 6,1)", "rgba(256,0,0,1)"]);


function drawEndPointResponseGraphAnimations(){
    //Add any new countries to list 
    var found;
    for(var name in endPointResponseUpdatedObjects){
        found = false;
        for(var i=0; i<endPointResponseObjects.length; i++){
            if(endPointResponseObjects[i].name == name){
                found = true;
                break;
            }
        }

        if(!found){
            var newEndPoint = {};
            newEndPoint.name = name;
            newEndPoint.series = [];
            newEndPoint.seriesResponse = [];
            newEndPoint.data = {};
            newEndPoint.region = endPointResponseUpdatedObjects[name].region;
            newEndPoint.response = {};
            newEndPoint.windowTotal = 0;
            newEndPoint.visible = false;
            endPointResponseObjects.push(newEndPoint);
        }
    }

    //Update the series for each endPoint regardless if they have new data or not
    var name;
    for(var i=0; i<endPointResponseObjects.length; i++){
        endPointResponseObjects[i].data = {};
        name = endPointResponseObjects[i].name;
        if(endPointResponseUpdatedObjects[name] == undefined){
            endPointResponseObjects[i].data["123"] = 0;
            endPointResponseObjects[i].data["4xx"] = 0;
            endPointResponseObjects[i].data["5xx"] = 0;
            endPointResponseObjects[i]["response"].value = 0;
            endPointResponseObjects[i]["response"].area = 0;
            endPointResponseObjects[i].uniqueIps = 0;
        }else{
            endPointResponseObjects[i].data["123"] = endPointResponseUpdatedObjects[name]["123"];
            endPointResponseObjects[i].data["4xx"] = endPointResponseUpdatedObjects[name]["4xx"];
            endPointResponseObjects[i].data["5xx"] = endPointResponseUpdatedObjects[name]["5xx"];
            endPointResponseObjects[i]["response"].value = endPointResponseUpdatedObjects[name]["response"]/endPointResponseUpdatedObjects[name]["responseCount"];
            endPointResponseObjects[i]["response"].area = endPointResponseObjects[i]["response"].value;
            endPointResponseObjects[i].uniqueIps = Object.keys(endPointResponseUpdatedObjects[name].ipList).length;
        }
        endPointResponseObjects[i].series.push(endPointResponseObjects[i].data);
        endPointResponseObjects[i].seriesResponse.push(endPointResponseObjects[i]["response"]);
        endPointResponseObjects[i].total = endPointResponseObjects[i].data["123"] + endPointResponseObjects[i].data["4xx"] + endPointResponseObjects[i].data["5xx"];
        endPointResponseObjects[i].windowTotal += endPointResponseObjects[i].total;

        //Subtract from total as data goes past window
        if(endPointResponseObjects[i].series.length > endPointDataFrames){
            var oldData = endPointResponseObjects[i].series.shift();
            endPointResponseObjects[i].windowTotal -= oldData["123"] + oldData["4xx"] + oldData["5xx"];
        }
    }

    //Sort based on highest connection count in window
    endPointResponseObjects.sort(function(a, b) {
        return b.windowTotal - a.windowTotal;
    });

    //Draw changes
    var containerParentHeight = 70;
    var graphCount = 0;
    for(var k=0; k<endPointResponseObjects.length; k++){
        name = endPointResponseObjects[k].name;

        if(graphCount < endPointGraphsMax){ //Add to screen
            if(!endPointResponseObjects[k].visible){
                setupEndPointGraph(name, endPointResponseObjects[k].region, endPointResponseObjects[k].series, endPointResponseObjects[k].seriesResponse);
                endPointResponseObjects[k].visible = true;
            }else{
                updateEndPointResponseTimelineGraph(name, endPointResponseObjects[k].data);
                updateEndPointResponseTimelineResponeTimeGraph(name, endPointResponseObjects[k]["response"]);
            }

            //Update counts in ui
            document.getElementById("endPoint"+name+"Connections").innerHTML = numberWithCommas(endPointResponseObjects[k].total);
            document.getElementById("endPoint"+name+"IPs").innerHTML = numberWithCommas(endPointResponseObjects[k].uniqueIps);
            document.getElementById("endPoint"+name+"ResonseTimes").innerHTML = (Math.round(endPointResponseObjects[k]["response"].value)/1000).toFixed(3) + "s";

            updateEndPointResponseTypeGraph("endPointResponseTypeGraph"+name, endPointResponseObjects[k].data);

            //Update position in ui
            document.getElementById("endPoint"+name+"ParentContainer").style.top = containerParentHeight*k + "px";

            graphCount++;
        }else{ //Remove from screen
            if(document.getElementById("endPoint"+name+"ParentContainer") != null){
                document.getElementById("endPoint"+name+"ParentContainer").outerHTML = "";
            }
            delete endPointTimeLineGraphs[name];
            delete endPointTimeLineResponseTimeGraphs[name];
            endPointResponseObjects[k].visible = false;
        }
    }
}

function clearEndPointResponseGraphs(){
    var name;
    for(var k=0; k<endPointResponseObjects.length; k++){
        name = endPointResponseObjects[k].name;

        if(document.getElementById("endPoint"+name+"ParentContainer") != null){
            document.getElementById("endPoint"+name+"ParentContainer").outerHTML = "";
        }
        delete endPointTimeLineGraphs[name];
        delete endPointTimeLineResponseTimeGraphs[name];
        endPointResponseObjects[k].visible = false;

        endPointResponseObjects[k].series = [];
        endPointResponseObjects[k].seriesResponse = [];
    }
}

function setupEndPointGraph(name, region, dataResponseTypes, dataResponseTiming){
    var endPointGraphContainer = document.getElementById("endPointGraphs");

    endPointGraphContainer.insertAdjacentHTML('beforeend',
        '<div id="endPoint'+name+'ParentContainer" class="endPointGraphContainersParents" onmousedown="zoomToRegion(\''+region+'\')">'+
            '<div class="endPointGraphContainers">'+
                '<span id="endPoint'+name+'Name" class="endPointName" >'+decodeEndPointName(name)+'</span>'+
                '<span id="endPoint'+name+'Connections" class="endPointConnections" ></span>'+
                '<span id="endPoint'+name+'IPs" class="endPointIPs" ></span>'+
                '<div id="graph-'+name+'"></div>'+
                '<div id="endPointResponseTypeGraph'+name+'" class="endPointResponseTypeGraphs"></div>'+
                '<div id="graph-responseTime-'+name+'" class="endPointResponseTimeGraphs"></div>'+
                '<span id="endPoint'+name+'ResonseTimes" class="endPointResponseTimes" ></span>'+
            '</div>'+
        '</div>');

    setupEndPointCircleGraph("endPointResponseTypeGraph"+name);
    setupEndPointTimeLineGraph(name, dataResponseTypes);
    setupEndPointTimeLineResponseTimeGraph(name, dataResponseTiming);
}

function setupEndPointCircleGraph(elementId){
    var svg = d3.select("#"+elementId)
	.append("svg")
	.append("g")

    svg.append("g")
        .attr("class", "slices");
    svg.append("g")
        .attr("class", "labels");
    svg.append("g")
        .attr("class", "lines");

    svg.attr("transform", "translate(" + endPointResponseGraphWidth / 2 + "," + endPointResponseGraphHeight / 2 + ")");
}

function setupEndPointTimeLineGraph(elementId, data){
    var graph = new Rickshaw.Graph( {
        element: document.getElementById("graph-"+elementId),
        width: 345,
        height: 25,
        renderer: 'multi',
        series: new Rickshaw.Series.FixedDuration([
            {
                name: '4xx',
                color: "#ff7b00",
                renderer: 'bar'
            },
            {
                name: '5xx',
                color: color5xx,
                renderer: 'bar'
            },
            { 
                name: '123',
                color: color123,
                renderer: 'bar'
            }
        ], undefined, {
            timeInterval: 250,
            maxDataPoints: endPointDataFrames,
            timeBase: new Date().getTime() / 1000
        })
    } );

    graph.offset = 'zero';

    for(var i=0; i<data.length; i++){
        graph.series.addData(data[i]);
    }
    graph.update();

    endPointTimeLineGraphs[elementId] = graph;
}

function setupEndPointTimeLineResponseTimeGraph(elementId, data){
    var graph = new Rickshaw.Graph( {
        element: document.getElementById("graph-responseTime-"+elementId),
        width: 345,
        height: 15,
        renderer: 'multi',
        series: new Rickshaw.Series.FixedDuration([
            {
                name: 'value',
                color: "#00adef",
                renderer: 'line',
                strokeWidth: 0.75
            },
            {
                name: 'area',
                color: "rgba(0,133,199,0.3)",
                renderer: 'area'
            }
        ], undefined, {
            timeInterval: 250,
            maxDataPoints: endPointDataFrames,
            timeBase: new Date().getTime() / 1000
        })
    } );

    graph.offset = 'zero';

    for(var i=0; i<data.length; i++){
        graph.series.addData(data[i]);
    }
    graph.update();

    endPointTimeLineResponseTimeGraphs[elementId] = graph;
}

function updateEndPointResponseTimelineGraph(elementId, object) {
    var graph = endPointTimeLineGraphs[elementId];
    var data = {};
    data["123"] = object["123"];
    data["4xx"] = object["4xx"];
    data["5xx"] = object["5xx"];
    graph.series.addData(data);
    graph.render();
    graph.update();
}

function updateEndPointResponseTimelineResponeTimeGraph(elementId, object) {
    var graph = endPointTimeLineResponseTimeGraphs[elementId];
    var data = {};
    data["value"] = object["value"];
    data["area"] = object["area"];
    graph.series.addData(data);
    graph.render();
    graph.update();
}

function updateEndPointResponseTypeGraph(elementId, object) {
    /*-------- DATA ---------*/
    var total = object["123"] + object["4xx"] + object["5xx"];
    var labels = endPointResponseGraphColorInner.domain();
	var data = labels.map(function(label){
		if(total > 0){
			if(label == "123"){return { label: label, value: object["123"]/total }}
			if(label == "4xx"){return { label: label, value: object["4xx"]/total }}
			if(label == "5xx"){return { label: label, value: object["5xx"]/total }}
		}else{
			return { label: label, value: 0 }
		}
	});

    var svg = d3.select("#"+elementId)

	/* ------- PIE SLICES -------*/
	var slice = svg.select(".slices").selectAll("path.slice")
		.data(endPointResponseGraphPie(data), data.label);

	slice.enter()
		.insert("path")
		.style("fill", function(d) { return endPointResponseGraphColorOutter(d.data.label); })
		.attr("class", "slice");

	slice		
		.transition().duration(1000)
		.attrTween("d", function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				return endPointResponseGraphArc(interpolate(t));
			};
        })
        
	slice.exit()
        .remove();

    var sliceMiddle = svg.select(".slices").selectAll("path.sliceMiddle")
		.data(endPointResponseGraphPie(data), data.label);

	sliceMiddle.enter()
		.insert("path")
		.style("fill", function(d) { return endPointResponseGraphColorMiddle(d.data.label); })
		.attr("class", "sliceMiddle");

	sliceMiddle		
		.transition().duration(1000)
		.attrTween("d", function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				return endPointResponseGraphArcMiddle(interpolate(t));
			};
        })
        
	sliceMiddle.exit()
        .remove();

    var sliceInner = svg.select(".slices").selectAll("path.sliceInner")
		.data(endPointResponseGraphPie(data), data.label);

	sliceInner.enter()
		.insert("path")
		.style("fill", function(d) { return endPointResponseGraphColorInner(d.data.label); })
		.attr("class", "sliceInner");

	sliceInner		
		.transition().duration(1000)
		.attrTween("d", function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				return endPointResponseGraphArcInner(interpolate(t));
			};
        })
        
	sliceInner.exit()
        .remove();
}