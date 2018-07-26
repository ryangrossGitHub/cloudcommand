var graphTotals = {};

var endPointHealthGraphs = [];
var endPoints = {};
var endPointHealthGraphsFrameCount = 0;
var endPointHealthGraphId;

function createNewEndPointGraph(name, type){
	var width = 400;
	var height = 60;

	document.getElementById("endPointHealth").insertAdjacentHTML('beforeend', '<span style="color:#00ADEF;float:left;">'+name+'</span><span id="graph-total-'+name+'" style="color:#ffffff;float:right;">0</span>');
	document.getElementById("endPointHealth").insertAdjacentHTML('beforeend', '<div id="graph-'+name+'" style="margin-bottom:5px;"></div>');

	var graph = new Rickshaw.Graph( {
		element: document.getElementById("graph-"+name),
		width: width,
		height: height,
		min: 100,
		interpolation: 'basis',
		series: new Rickshaw.Series.FixedDuration([
			{
				name: '4xx',
				color: color4xx
			},
			{
				name: '5xx',
				color: color5xx
			},
			{ 
				name: '123',
				color: color123 
			},
		], undefined, {
			timeInterval: 250,
			maxDataPoints: 150,
			timeBase: new Date().getTime() / 1000
		})
	} );

	var smoother = new Rickshaw.Graph.Smoother( {
		graph: graph,
		element: document.querySelector('#smoother'),
	} );

	var axes = new Rickshaw.Graph.Axis.Y( {
		graph: graph,
		pixelsPerTick: 30,
		tickFormat: function(y){return y/1000 + 's';},
		ticksTreatment: 'inverse'
	} );
	axes.render();

	if(type == "steam"){
		graph.setRenderer('stack');
		graph.offset = 'wiggle';
		smoother.setScale(40);
	}else if(type == "line"){
		graph.setRenderer('line');
		graph.offset = 'zero';
		smoother.setScale(30);
	}else if(type == "scatter"){
		graph.setRenderer('scatterplot', {dotSize:1.2});
		graph.offset = 'value';
	}
	graph.update();

	endPointHealthGraphs.push(graph);

	var endPoint = {};
	endPoint["4xx"] = 0;
	endPoint["5xx"] = 0;
	endPoint["123"] = 0;
	endPoints[name] = endPoint;

	graphTotals[name] = 0;
}

function startEndPointGraphAnimations(){
	setInterval( function() {

			for(var endPoint in endPoints){
				var random = Math.random();
				if(random < 0.1){
					endPoints[endPoint]["4xx"] = Math.floor((Math.random() * 2500) + 200);
					graphTotals[endPoint] ++;
				}else {
					endPoints[endPoint]["4xx"] = 0;
				}

				if(random < 0.3 && random > 0.2){
					endPoints[endPoint]["5xx"] = Math.floor((Math.random() * 2500) + 200);
					graphTotals[endPoint] ++;
				}else{
					endPoints[endPoint]["5xx"] = 0;
				}

				if(random > 0.5){
					endPoints[endPoint]["123"] = Math.floor((Math.random() * 1200) + 200);
					graphTotals[endPoint] ++;
				}else{
					endPoints[endPoint]["123"] = 0;
				}
			}

			var endPointHealthGraphId;
			for(var i=0; i<endPointHealthGraphs.length; i++){
				endPointHealthGraphId = endPointHealthGraphs[i].element.id;
				endPointHealthGraphId = endPointHealthGraphId.substring("graph-".length, endPointHealthGraphId.length);
				endPointHealthGraphs[i].series.addData(endPoints[endPointHealthGraphId]);
				endPointHealthGraphs[i].update();
				document.getElementById("graph-total-"+endPointHealthGraphId).innerHTML = numberWithCommas(graphTotals[endPointHealthGraphId]);
			}
	}, 1000 );
}