// var svg = d3v4.select("#connectionDensity"),
//     margin = {top: 0, right: 0, bottom: 0, left: 0},
//     width = +svg.attr("width") - margin.left - margin.right,
//     height = +svg.attr("height") - margin.top - margin.bottom,
//     g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var densityMaxValue = (width+height)*0.15;
var volumeMaxValue = (width+height)*8;
var trafficVolume = trafficPerMinuteActual;
var trafficDensityRatioAverage = 10;
var trafficDensityRatio;
var trafficDensityRatioHigh;
var trafficDensityRatioLow;

// calculateTrafficDensity();

// var randomX = d3v4.randomNormal(width / 2, trafficDensityRatio),
//     randomY = d3v4.randomNormal(height / 2, trafficDensityRatio),
//     points = d3v4.range(trafficVolume).map(function() { return [randomX(), randomY()]; });

// var color = d3v4.scaleSequential(d3v4.interpolateLab("black", "#00adef"))
//     .domain([0, 20]);

// var hexbin = d3.hexbin()
//     .radius(5)
//     .extent([[0, 0], [width, height]]);

// var x = d3v4.scaleLinear()
//     .domain([0, 1])
//     .range([0, 1]);

// var y = d3v4.scaleLinear()
//     .domain([0, height])
//     .range([height, 0]);

// g.append("clipPath")
//     .attr("id", "clip")
//   .append("rect")
//     .attr("width", width)
//     .attr("height", height);

// g.append("g")
//     .attr("class", "hexagon")
//     .attr("clip-path", "url(#clip)")
//   .selectAll("path")
//   .data(hexbin(points))
//   .enter().append("path")
//     .attr("d", hexbin.hexagon())
//     .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
//     .attr("fill", function(d) { return color(d.length); });

// function drawHoneyCombDensityGraph(){
//         //Clear
//         g.selectAll("g.hexagon")
//         .selectAll("path").remove();

//         //Get new data
//         var direction = Math.random();
//         if(direction > 0.5){
//             direction = 1;
//         }else{
//             direction = -1;
//         }


//         trafficPerMinuteActual += Math.round(((Math.random()*20)+1) * direction);
//         if(trafficPerMinuteActual < 0){
//             trafficPerMinuteActual = 0;
//         }

//         uniqueIpPerMinuteActual += Math.round(((Math.random()*10)+1) * direction);
//         if(uniqueIpPerMinuteActual < 0){
//             uniqueIpPerMinuteActual = 0;
//         }
//         calculateTrafficDensity();

//         points = d3v4.range(trafficVolume).map(function() { 
//             return [
//                 d3v4.randomNormal(width / 2, trafficDensityRatio)(),
//                 d3v4.randomNormal(height / 2, trafficDensityRatio)()
//                 ]; 
//         });

//         //Re-draw
//         g.selectAll("g.hexagon")
//         .selectAll("path")
//         .data(hexbin(points))
//         .enter()
//         .append("path")
//             .attr("d", hexbin.hexagon())
//             .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
//             .attr("fill", function(d) { return color(d.length); });
// }

function calculateTrafficDensity(){
    trafficDensityRatio = uniqueIpPerMinuteActual/trafficPerMinuteActual*densityMaxValue;
    trafficDensityRatioHigh = trafficDensityRatioAverage + (trafficDensityRatioAverage/6);
    trafficDensityRatioLow = trafficDensityRatioAverage - (trafficDensityRatioAverage/6);

    document.getElementById("connectionsPerMinute").innerHTML = numberWithCommas(trafficPerMinuteActual) + "<p>Connections/Min</p>";
    document.getElementById("uniqueIPsPerMinute").innerHTML = numberWithCommas(uniqueIpPerMinuteActual) + "<p>Unique IP's/Min</p>";
    document.getElementById("averageConnectionsPerUniqueIp").innerHTML = (trafficPerMinuteActual/uniqueIpPerMinuteActual).toFixed(1)+ "<p>Connections/Unique IP</p>";

    //Adjust based on average
    // if(trafficDensityRatio >= trafficDensityRatioHigh){
    //     if(trafficDensityRatio == 0){
    //         trafficDensityRatio = 0.0001;
    //     }
    //     trafficDensityRatioHigh = trafficDensityRatio + (trafficDensityRatio/6);
    // }else if(trafficDensityRatio <= trafficDensityRatioLow){
    //     trafficDensityRatioLow = trafficDensityRatio - (trafficDensityRatio/6);
    // }
    // trafficDensityRatio = scaleBetween(trafficDensityRatio, 0, densityMaxValue, trafficDensityRatioLow, trafficDensityRatioHigh)

    // trafficVolume = trafficPerMinuteActual;
    // //Limit traffic points on graph for performance
    // if(trafficVolume > volumeMaxValue){
    //     trafficVolume = volumeMaxValue;
    // }
}