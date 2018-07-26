var countryResponseObjects = [];
var countryResponseUpdatedObjects = {};
var countryTimeLineGraphs = {};
var countryDataFrames = 50;
var countryGraphsMax = 10;

var countryResponseGraphWidth = 100,
    countryResponseGraphHeight = 60,
	countryResponseGraphRadius = Math.min(countryResponseGraphWidth, countryResponseGraphHeight) / 2;

var countryResponseGraphPie = d3.layout.pie()
	.sort(null)
	.value(function(d) {
		return d.value;
	});

var countryResponseGraphArc = d3.svg.arc()
	.outerRadius(countryResponseGraphRadius * 0.7)
    .innerRadius(countryResponseGraphRadius * 0.65);

var countryResponseGraphArcMiddle = d3.svg.arc()
	.outerRadius(countryResponseGraphRadius * 0.65)
    .innerRadius(countryResponseGraphRadius * 0.4);

var countryResponseGraphArcInner = d3.svg.arc()
	.outerRadius(countryResponseGraphRadius * 0.35)
    .innerRadius(countryResponseGraphRadius * 0.3);
    
var countryResponseGraphColorInner = d3.scale.ordinal()
    .domain(["123", "4xx", "5xx"])
    .range(["rgba(256,256,256,0.5)", "rgba(209, 102, 6,0.6)", "rgba(256,0,0,0.5)"]);

var countryResponseGraphColorMiddle = d3.scale.ordinal()
    .domain(["123", "4xx", "5xx"])
    .range(["rgba(256,256,256,0.7)", "rgba(209, 102, 6,0.8)", "rgba(256,0,0,0.7)"]);

var countryResponseGraphColorOutter = d3.scale.ordinal()
    .domain(["123", "4xx", "5xx"])
    .range(["rgba(256,256,256,1)", "rgba(209, 102, 6,1)", "rgba(256,0,0,1)"]);


function drawCountryResponseGraphAnimations(){
    //Add any new countries to list 
    var found;
    for(var name in countryResponseUpdatedObjects){
        found = false;
        for(var i=0; i<countryResponseObjects.length; i++){
            if(countryResponseObjects[i].name == name){
                found = true;
                break;
            }
        }

        if(!found){
            var newCountry = {};
            newCountry.name = name;
            newCountry.series = [];
            newCountry.data = {};
            newCountry.windowTotal = 0;
            newCountry.visible = false;
            countryResponseObjects.push(newCountry);
        }
    }

    //Update the series for each country regardless if they have new data or not
    var name;
    for(var i=0; i<countryResponseObjects.length; i++){
        countryResponseObjects[i].data = {};
        name = countryResponseObjects[i].name;
        if(countryResponseUpdatedObjects[name] == undefined){
            countryResponseObjects[i].data["123"] = 0;
            countryResponseObjects[i].data["4xx"] = 0;
            countryResponseObjects[i].data["5xx"] = 0;
            countryResponseObjects[i].uniqueIps = 0;
        }else{
            countryResponseObjects[i].data["123"] = countryResponseUpdatedObjects[name]["123"];
            countryResponseObjects[i].data["4xx"] = countryResponseUpdatedObjects[name]["4xx"];
            countryResponseObjects[i].data["5xx"] = countryResponseUpdatedObjects[name]["5xx"];
            countryResponseObjects[i].uniqueIps = Object.keys(countryResponseUpdatedObjects[name].ipList).length;
        }
        countryResponseObjects[i].series.push(countryResponseObjects[i].data);
        countryResponseObjects[i].total = countryResponseObjects[i].data["123"] + countryResponseObjects[i].data["4xx"] + countryResponseObjects[i].data["5xx"];
        countryResponseObjects[i].windowTotal += countryResponseObjects[i].total;

        //Subtract from total as data goes past window
        if(countryResponseObjects[i].series.length > countryDataFrames){
            var oldData = countryResponseObjects[i].series.shift();
            countryResponseObjects[i].windowTotal -= oldData["123"] + oldData["4xx"] + oldData["5xx"];
        }
    }

    //Sort based on highest connection count in window
    countryResponseObjects.sort(function(a, b) {
        return b.windowTotal - a.windowTotal;
    });

    //Draw changes
    var containerParentHeight = 56;
    var graphCount = 0;
    for(var k=0; k<countryResponseObjects.length; k++){
        name = countryResponseObjects[k].name;

        if(graphCount < countryGraphsMax){ //Add to screen
            if(!countryResponseObjects[k].visible){
                setupCountryGraph(name, countryResponseObjects[k].series);
                countryResponseObjects[k].visible = true;
            }else{
                updateCountryResponseTimelineGraph(name, countryResponseObjects[k].data);
            }

            //Update counts in ui
            document.getElementById("country"+name+"Connections").innerHTML = numberWithCommas(countryResponseObjects[k].total);
            document.getElementById("country"+name+"IPs").innerHTML = numberWithCommas(countryResponseObjects[k].uniqueIps);

            updateCountryResponseTypeGraph("countryResponseTypeGraph"+name, countryResponseObjects[k].data);

            //Update position in ui
            document.getElementById("country"+name+"ParentContainer").style.top = containerParentHeight*k + "px";

            graphCount++;
        }else{ //Remove from screen
            if(document.getElementById("country"+name+"ParentContainer") != null){
                document.getElementById("country"+name+"ParentContainer").outerHTML = "";
            }
            delete countryTimeLineGraphs[name];
            countryResponseObjects[k].visible = false;
        }
    }
}

function clearCountryGraphs(){
    var name;
    for(var k=0; k<countryResponseObjects.length; k++){
        name = countryResponseObjects[k].name;

         if(document.getElementById("country"+name+"ParentContainer") != null){
            document.getElementById("country"+name+"ParentContainer").outerHTML = "";
        }
        delete countryTimeLineGraphs[name];
        countryResponseObjects[k].visible = false;

        countryResponseObjects[k].series = [];
    }
}

function setupCountryGraph(name, data){
    var countryGraphContainer = document.getElementById("countryGraphs");

    countryGraphContainer.insertAdjacentHTML('beforeend',
        '<div id="country'+name+'ParentContainer" class="countryGraphContainersParents" onmousedown="zoomToCountry(\''+decodeCountryName(name)+'\')">'+
            '<div class="countryGraphContainers">'+
                '<span id="country'+name+'Name" class="countryName" >'+decodeCountryName(name)+'</span>'+
                '<span id="country'+name+'Connections" class="countryConnections" ></span>'+
                '<span id="country'+name+'IPs" class="countryIPs" ></span>'+
                '<div id="graph-'+name+'"></div>'+
                '<div id="countryResponseTypeGraph'+name+'" class="countryResponseTypeGraphs"></div>'+
            '</div>'+
        '</div>');

    setupCountryCircleGraph("countryResponseTypeGraph"+name);
    setupCountryTimeLineGraph(name, data);
}

function setupCountryCircleGraph(elementId){
    var svg = d3.select("#"+elementId)
	.append("svg")
	.append("g")

    svg.append("g")
        .attr("class", "slices");
    svg.append("g")
        .attr("class", "labels");
    svg.append("g")
        .attr("class", "lines");

    svg.attr("transform", "translate(" + countryResponseGraphWidth / 2 + "," + countryResponseGraphHeight / 2 + ")");
}

function setupCountryTimeLineGraph(elementId, data){
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
            maxDataPoints: countryDataFrames,
            timeBase: new Date().getTime() / 1000
        })
    } );

    graph.offset = 'zero';

    for(var i=0; i<data.length; i++){
        graph.series.addData(data[i]);
    }
    graph.update();

    countryTimeLineGraphs[elementId] = graph;
}

function updateCountryResponseTimelineGraph(elementId, object) {
    var graph = countryTimeLineGraphs[elementId];
    var data = {};
    data["123"] = object["123"];
    data["4xx"] = object["4xx"];
    data["5xx"] = object["5xx"];
    graph.series.addData(data);
    graph.render();
    graph.update();
}

function updateCountryResponseTypeGraph(elementId, object) {
    /*-------- DATA ---------*/
    var total = object["123"] + object["4xx"] + object["5xx"];
    var labels = countryResponseGraphColorInner.domain();
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
		.data(countryResponseGraphPie(data), data.label);

	slice.enter()
		.insert("path")
		.style("fill", function(d) { return countryResponseGraphColorOutter(d.data.label); })
		.attr("class", "slice");

	slice		
		.transition().duration(1000)
		.attrTween("d", function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				return countryResponseGraphArc(interpolate(t));
			};
        })
        
	slice.exit()
        .remove();

    var sliceMiddle = svg.select(".slices").selectAll("path.sliceMiddle")
		.data(countryResponseGraphPie(data), data.label);

	sliceMiddle.enter()
		.insert("path")
		.style("fill", function(d) { return countryResponseGraphColorMiddle(d.data.label); })
		.attr("class", "sliceMiddle");

	sliceMiddle		
		.transition().duration(1000)
		.attrTween("d", function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				return countryResponseGraphArcMiddle(interpolate(t));
			};
        })
        
	sliceMiddle.exit()
        .remove();

    var sliceInner = svg.select(".slices").selectAll("path.sliceInner")
		.data(countryResponseGraphPie(data), data.label);

	sliceInner.enter()
		.insert("path")
		.style("fill", function(d) { return countryResponseGraphColorInner(d.data.label); })
		.attr("class", "sliceInner");

	sliceInner		
		.transition().duration(1000)
		.attrTween("d", function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				return countryResponseGraphArcInner(interpolate(t));
			};
        })
        
	sliceInner.exit()
        .remove();
}