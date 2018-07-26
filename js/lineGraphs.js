var lineGraphs = [];

createNewLineGraph("Connections", "trafficLineGraphs", "area", "half", "#00adef", "rgba(0,133,199,0.3)", 1);
createNewLineGraph("Unique IPs", "trafficLineGraphs", "area", "half", "#00adef", "rgba(0,133,199,0.3)", 1);
createNewLineGraph("Success", "responseLineGraphs", "area", "third", color123, "rgba(256,256,256,0.3)", 0.5);
createNewLineGraph("Rejected", "responseLineGraphs", "area", "third", color4xx, "rgba(209, 102, 6,0.3)", 0.5);
createNewLineGraph("Error", "responseLineGraphs", "area", "third", color5xx, "rgba(256,0,0,0.3)", 0.5);

function createNewLineGraph(name, parent, type, size, color, fillColor, lineWidth){
	var width = 208;
	var height = 60;

	if(size == "third"){
		width = 140;
		height = 50;
	}

	document.getElementById(parent).insertAdjacentHTML('beforeend', '<div id="graph-'+name+'"><span style="color:'+color+'" class="'+parent+'Titles">'+name+'</span><span id="graph-total-'+name+'" class="'+parent+'Totals">0</span></div>');

	var graph = new Rickshaw.Graph( {
		element: document.getElementById("graph-"+name),
		width: width,
		height: height,
		renderer: 'multi',
		series: new Rickshaw.Series.FixedDuration([
			{
				name: 'value',
				color: color,
				strokeWidth: lineWidth,
				renderer: 'line'
			},
			{
				name: 'area',
				color: fillColor,
				renderer: 'area'
			}
		], undefined, {
			timeInterval: 250,
			maxDataPoints: 30,
			timeBase: new Date().getTime() / 1000
		})
	} );

	// graph.setRenderer(type);
	graph.offset = 'zero';
	graph.update();

	lineGraphs.push(graph);
}

function drawLineGraphAnimations(connections, uniqueIps, success, rejected, error){
	var id, data;
	var total = success + rejected + error;

	for(var i=0; i<lineGraphs.length; i++){
		data = {};
		
		id = lineGraphs[i].element.id;
		id = id.substring("graph-".length, id.length);

		if(id == "Connections"){
			data.value = connections;
			data.area = connections;
		}else if(id == "Unique IPs"){
			data.value = uniqueIps;
			data.area = uniqueIps;
		}else if(id == "Success"){
			data.value = success;
			data.area = success;
		}else if(id == "Rejected"){
			data.value = rejected;
			data.area = rejected;
		}else if(id == "Error"){
			data.value = error;
			data.area = error;
		}

		lineGraphs[i].series.addData(data);
		lineGraphs[i].update();
		if(id == "Success" || id == "Rejected" || id == "Error"){
			if(total == 0){
				document.getElementById("graph-total-"+id).innerHTML = "0%";
			}else{
				document.getElementById("graph-total-"+id).innerHTML = Math.round(data.value/total*100) + "%";
			}
		}else{
			document.getElementById("graph-total-"+id).innerHTML = numberWithCommas(data.value);
		}
	}
}

function clearLineGraphs(){
	var id, data;
	for(var n=0; n<150; n++){
		for(var i=0; i<lineGraphs.length; i++){
			data = {};
			
			id = lineGraphs[i].element.id;
			id = id.substring("graph-".length, id.length);

			data.value = 0;

			lineGraphs[i].series.addData(data);
			lineGraphs[i].update();
		}
	}

	for(var k=0; k<lineGraphs.length; k++){
		id = lineGraphs[k].element.id;
		id = id.substring("graph-".length, id.length);
		document.getElementById("graph-total-"+id).innerHTML = 0;

		lineGraphs[k].update();
	}
}