var responseCodeGraphSvg = d3.select("#responseCodeGraph")
	.append("svg")
	.append("g")

responseCodeGraphSvg.append("g")
	.attr("class", "slices");
responseCodeGraphSvg.append("g")
	.attr("class", "labels");
responseCodeGraphSvg.append("g")
	.attr("class", "lines");

var responseCodeGraphWidth = 275,
    responseCodeGraphHeight = 150,
	responseCodeGraphRadius = Math.min(responseCodeGraphWidth, responseCodeGraphHeight) / 2;

var responseCodeGraphArc = d3.svg.arc()
	.outerRadius(responseCodeGraphRadius * 0.8)
	.innerRadius(responseCodeGraphRadius * 0.75);

var responseCodeGraphOuterArc = d3.svg.arc()
	.innerRadius(responseCodeGraphRadius * 0.9)
	.outerRadius(responseCodeGraphRadius * 0.9);

responseCodeGraphSvg.attr("transform", "translate(" + responseCodeGraphWidth / 2 + "," + responseCodeGraphHeight / 2 + ")");

var responseCodeGraphColor = d3.scale.ordinal()
	.domain(["Success", "Rejected", "Error"])
    .range([color123, color4xx, color5xx]);

function drawResponseCodeGraph(response, responseCodes123, responseCodes4xx, responseCodes5xx) {
	var total = responseCodes123 + responseCodes4xx + responseCodes5xx;
	if(total == 0){
		document.getElementById("responseCodeValue123").innerHTML = "0%";
		document.getElementById("responseCodeValue4xx").innerHTML = "0%";
		document.getElementById("responseCodeValue5xx").innerHTML = "0%";
		document.getElementById("averageResponseTimeValue").innerHTML = (0).toFixed(3) + "s";
	}else{
		document.getElementById("responseCodeValue123").innerHTML = Math.round(responseCodes123/total * 100) + "%";
		document.getElementById("responseCodeValue4xx").innerHTML = Math.round(responseCodes4xx/total * 100) + "%";
		document.getElementById("responseCodeValue5xx").innerHTML = Math.round(responseCodes5xx/total * 100) + "%";
		document.getElementById("averageResponseTimeValue").innerHTML = (Math.round(response)/1000).toFixed(3) + "s";
	}

	var labels = responseCodeGraphColor.domain();
	var data = labels.map(function(label){
		if(total > 0){
			if(label == "Success"){return { label: label, value: responseCodes123/total }}
			if(label == "Rejected"){return { label: label, value: responseCodes4xx/total }}
			if(label == "Error"){return { label: label, value: responseCodes5xx/total }}
		}else{
			return { label: label, value: 0 }
		}
	});

	/* ------- PIE SLICES -------*/
	var slice = responseCodeGraphSvg.select(".slices").selectAll("path.slice")
		.data(pie(data), key);

	slice.enter()
		.insert("path")
		.style("fill", function(d) { return responseCodeGraphColor(d.data.label); })
		.attr("class", "slice");

	slice		
		.transition().duration(1000)
		.attrTween("d", function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				return responseCodeGraphArc(interpolate(t));
			};
		})

	slice.exit()
		.remove();

	/* ------- TEXT LABELS -------*/

	var text = responseCodeGraphSvg.select(".labels").selectAll("text")
		.data(pie(data), key);

	text.enter()
		.append("text")
		.attr("dy", ".35em")
		.style("fill", function(d) { return responseCodeGraphColor(d.data.label); })
		.attr("id", function(d){
			return "responseCodeGraphText-"+d.data.label;
		})
		.text(function(d) {
			return d.data.label;
		});
	
	function midAngle(d){
		return d.startAngle + (d.endAngle - d.startAngle)/2;
	}

	text.transition().duration(1000)
		.attrTween("transform", function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				var d2 = interpolate(t);
				var pos = responseCodeGraphOuterArc.centroid(d2);
				pos[0] = responseCodeGraphRadius * (midAngle(d2) < Math.PI ? 1 : -1);
				return "translate("+ pos +")";
			};
		})
		.styleTween("text-anchor", function(d){
			if(d.data.value == 0){
				document.getElementById("responseCodeGraphText-"+d.data.label).style.display = "none";
			}else{
				document.getElementById("responseCodeGraphText-"+d.data.label).style.display = "block";
			}

			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				var d2 = interpolate(t);
				return midAngle(d2) < Math.PI ? "start":"end";
			};
		});

	text.exit()
		.remove();

	/* ------- SLICE TO TEXT POLYLINES -------*/

	var polyline = responseCodeGraphSvg.select(".lines").selectAll("polyline")
		.data(pie(data), key);
	
	polyline.enter()
		.append("polyline")
		.attr("id", function(d){
			return "responseCodeGraphLine-"+d.data.label;
		});

	polyline.transition().duration(1000)
		.attrTween("points", function(d){
			if(d.data.value == 0){
				document.getElementById("responseCodeGraphLine-"+d.data.label).style.display = "none";
			}else{
				document.getElementById("responseCodeGraphLine-"+d.data.label).style.display = "block";
			}
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				var d2 = interpolate(t);
				var pos = responseCodeGraphOuterArc.centroid(d2);
				pos[0] = responseCodeGraphRadius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
				return [responseCodeGraphArc.centroid(d2), responseCodeGraphOuterArc.centroid(d2), pos];
			};			
		});
	
	polyline.exit()
		.remove();
};