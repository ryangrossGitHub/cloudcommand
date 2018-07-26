var valueMobile = 0.0;
var valueTablet = 0.0;
var valueMonitor = 0.0;
var deviceCircleGraphWidth = 150;
var deviceCircleGraphHeight = 75;
var deviceCircleGraphRadius = Math.min(deviceCircleGraphWidth, deviceCircleGraphHeight) / 1.5;

var deviceCircleGraphMobile = d3.select("#deviceCircleGraphMobile")
	.append("svg")
	.append("g")

var deviceCircleGraphTablet = d3.select("#deviceCircleGraphTablet")
	.append("svg")
	.append("g")

var deviceCircleGraphMonitor = d3.select("#deviceCircleGraphMonitor")
	.append("svg")
	.append("g")

deviceCircleGraphMobile.append("g")
	.attr("class", "slices");

deviceCircleGraphTablet.append("g")
	.attr("class", "slices");

deviceCircleGraphMonitor.append("g")
	.attr("class", "slices");

var pie = d3.layout.pie()
	.sort(null)
	.value(function(d) {
		return d.value;
	});

var key = function(d){ return d.data.label; };

var arcDevice = d3.svg.arc()
	.outerRadius(deviceCircleGraphRadius * 0.8)
	.innerRadius(deviceCircleGraphRadius * 0.78);

var outerArcDevice = d3.svg.arc()
	.innerRadius(deviceCircleGraphRadius * 0.9)
	.outerRadius(deviceCircleGraphRadius * 0.9);

deviceCircleGraphMobile.attr("transform", "scale(-1,1) translate(" + -deviceCircleGraphWidth / 2.8 + "," + deviceCircleGraphHeight / 1.4 + ") rotate(180)");
deviceCircleGraphTablet.attr("transform", "scale(-1,1) translate(" + -deviceCircleGraphWidth / 2.8 + "," + deviceCircleGraphHeight / 1.4 + ") rotate(180)");
deviceCircleGraphMonitor.attr("transform", "scale(-1,1) translate(" + -deviceCircleGraphWidth / 2.8 + "," + deviceCircleGraphHeight / 1.4 + ") rotate(180)");

var deviceCircleGraphColorMobile = d3.scale.ordinal()
	.domain(["background", "value"])
	.range(["trasparent", "#00ADEF"]);

var deviceCircleGraphColorTablet = d3.scale.ordinal()
	.domain(["background", "value"])
	.range(["trasparent", "#00ADEF"]);

var deviceCircleGraphColorMonitor = d3.scale.ordinal()
	.domain(["background", "value"])
	.range(["trasparent", "#00ADEF"]);

function updateDeviceCircleGraphs (val, color){
	var labels = color.domain();
	return labels.map(function(label){
        if(label == "value"){
            return { label: label, value: val }
        }else{
            return { label: label, value: 1-val }
        }
	});
}

function drawDeviceCircleGraphAnimations(mobile, tablet, desktop){
		valueMobile = Math.round((mobile * 100));
        drawDeviceCircleGraphs(updateDeviceCircleGraphs(mobile, deviceCircleGraphColorMobile), deviceCircleGraphMobile, deviceCircleGraphColorMobile);
        document.getElementById("deviceCircleGraphMobilePercent").innerHTML = valueMobile + "%";

        valueTablet = Math.round((tablet * 100));
        drawDeviceCircleGraphs(updateDeviceCircleGraphs(tablet, deviceCircleGraphColorTablet), deviceCircleGraphTablet, deviceCircleGraphColorTablet);
		document.getElementById("deviceCircleGraphTabletPercent").innerHTML = valueTablet + "%";

        valueMonitor = Math.round((desktop * 100));
        drawDeviceCircleGraphs(updateDeviceCircleGraphs(desktop, deviceCircleGraphColorMonitor), deviceCircleGraphMonitor, deviceCircleGraphColorMonitor);
		document.getElementById("deviceCircleGraphMonitorPercent").innerHTML = valueMonitor + "%";
}


function drawDeviceCircleGraphs(data, graph, color) {

	/* ------- PIE SLICES -------*/
	var slice = graph.select(".slices").selectAll("path.slice")
		.data(pie(data), key);

	slice.enter()
		.insert("path")
		.style("fill", function(d) { return color(d.data.label); })
		.attr("class", "slice");

	slice		
		.transition().duration(500)
		.attrTween("d", function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				return arcDevice(interpolate(t));
			};
		})

	slice.exit()
		.remove();

	};