var mapLargeScope = "world";

var mapDataSet = {};
var mapDataSetUSA = {};
var mapMinValue = 0;
var mapMaxValue = 0;
var mapMinValueUSA = 0;
var mapMaxValueUSA = 0;

var map = new Datamap({
        element: document.getElementById('dataMapContainer'),
        // countries don't listed in mapDataSet will be painted with this color
        fills: { defaultFill: 'transparent' },
        data: {},
        scope: 'world',
        responsive: false,
        geographyConfig: {
            borderColor: '#00ADEF',
            borderWidth: 0.1,
            popupOnHover: false,
            highlightOnHover: false
        }
    });

    var mapLargeWorld = new Datamap({
        element: document.getElementById('dataMapContainerLargeWorld'),
        // countries don't listed in mapDataSet will be painted with this color
        fills: { defaultFill: 'transparent' },
        data: {},
        scope: 'world',
        responsive: false,
        geographyConfig: {
            borderColor: '#00ADEF',
            borderWidth: 0.7,
            highlightBorderWidth: 0.7,
            highlightFillColor: function(geo) {
                return '#00adef';
            },
            highlightBorderColor: '#00ADEF',
            // show desired information in tooltip
            popupTemplate: function(geo, data) {
                if (data == null || data.numberOfThings == undefined) { 
                    return ['<div class="hoverinfo">',
                        '<strong>', geo.properties.name, '</strong>',
                        '<br>Connections: <strong>0</strong>',
                        '</div>'].join(''); 
                }else{
                    return ['<div class="hoverinfo">',
                        '<strong>', geo.properties.name, '</strong>',
                        '<br>Connections: <strong>', numberWithCommas(data.numberOfThings), '</strong>',
                        '</div>'].join('');
                }
            }
        },
        done: function(datamap){
            datamap.svg.call(d3.behavior.zoom().scaleExtent([1, 50]).on("zoom", redraw));
            function redraw() {
                datamap.svg.selectAll("g").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            }
        }
    });

    var mapLargeUSA = new Datamap({
        element: document.getElementById('dataMapContainerLargeUSA'),
        // countries don't listed in mapDataSet will be painted with this color
        fills: { defaultFill: 'transparent' },
        data: {},
        scope: 'usa',
        responsive: false,
        geographyConfig: {
            borderColor: '#00ADEF',
            borderWidth: 0.7,
            highlightBorderWidth: 0.7,
            highlightFillColor: function(geo) {
                return '#00adef';
            },
            highlightBorderColor: '#00ADEF',
            // show desired information in tooltip
            popupTemplate: function(geo, data) {
                if (data == null || data.numberOfThings == undefined) { 
                    return ['<div class="hoverinfo">',
                        '<strong>', geo.properties.name, '</strong>',
                        '<br>Connections: <strong>0</strong>',
                        '</div>'].join(''); 
                }else{
                    return ['<div class="hoverinfo">',
                        '<strong>', geo.properties.name, '</strong>',
                        '<br>Connections: <strong>', numberWithCommas(data.numberOfThings), '</strong>',
                        '</div>'].join('');
                }
            }
        },
        done: function(datamap){
            datamap.svg.call(d3.behavior.zoom().scaleExtent([1, 50]).on("zoom", redraw));
            function redraw() {
                datamap.svg.selectAll("g").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            }
        }
    });

 function resetLargeMapZoom() { 
     mapLargeWorld.svg.selectAll("g").attr("transform", "translate(0,0)scale(1.0)"); 
     mapLargeUSA.svg.selectAll("g").attr("transform", "translate(0,0)scale(1.0)"); 
}

function drawMap(mapData){
    // We need to colorize every country based on "numberOfWhatever"
    // colors should be uniq for every value.
    // For this purpose we create palette(using min/max mapData-value)
    var dataSet = {};
    var mapOnlyValues = mapData.map(function(obj){ return obj[1]; });
    var mapMinValue = Math.min.apply(null, mapOnlyValues),
            mapMaxValue = Math.max.apply(null, mapOnlyValues);

    if(mapMinValue == mapMaxValue){ mapMinValue = 0;}
    // create color palette function
    // color can be whatever you wish
    var paletteScale = d3.scale.linear()
        .domain([mapMinValue,mapMaxValue])
        .range(["#00212d","#00adef"]); // blue color

    mapData.forEach(function(item){ //
            // item example value ["USA", 70]
            var iso = item[0],
                    value = item[1];
            dataSet[iso] = { numberOfThings: value, fillColor: paletteScale(value) };
        });

    map.updateChoropleth(dataSet, {reset: true})
}

function drawMapLarge(mapData, scope){
    // We need to colorize every country based on "numberOfWhatever"
    // colors should be uniq for every value.
    // For this purpose we create palette(using min/max mapData-value)
    // create color palette function
    // color can be whatever you wish
    var paletteScale;

    //Set number of things, min, and max
    mapData.forEach(function(item){ //
            // item example value ["USA", 70]
            var iso = item[0],
                    value = item[1];

            if(scope == "world"){
                if(mapDataSet[iso] == undefined){
                    mapDataSet[iso] = { numberOfThings: value, fillColor: null };
                }else{
                    mapDataSet[iso].numberOfThings += value;
                }

                if(mapMinValue == 0 || mapMinValue > mapDataSet[iso].numberOfThings){
                    mapMinValue = mapDataSet[iso].numberOfThings;
                }

                if(mapDataSet[iso].numberOfThings > mapMaxValue){
                    mapMaxValue = mapDataSet[iso].numberOfThings;
                }
            }else{
                if(mapDataSetUSA[iso] == undefined){
                    mapDataSetUSA[iso] = { numberOfThings: value, fillColor: null };
                }else{
                    mapDataSetUSA[iso].numberOfThings += value;
                }

                if(mapMinValueUSA == 0 || mapMinValueUSA > mapDataSetUSA[iso].numberOfThings){
                    mapMinValueUSA = mapDataSetUSA[iso].numberOfThings;
                }

                if(mapDataSetUSA[iso].numberOfThings > mapMaxValueUSA){
                    mapMaxValueUSA = mapDataSetUSA[iso].numberOfThings;
                }
            }
        });

    if(scope == "world"){
        paletteScale = d3.scale.linear()
            .domain([mapMinValue,mapMaxValue])
            .range(["#00212d","#00adef"]);

        for(var iso in mapDataSet){
            mapDataSet[iso].fillColor = paletteScale(mapDataSet[iso].numberOfThings);
        }
        mapLargeWorld.updateChoropleth(mapDataSet, {reset: true});
    }else{
        paletteScale = d3.scale.linear()
            .domain([mapMinValueUSA,mapMaxValueUSA])
            .range(["#00212d","#00adef"]);

        for(var iso in mapDataSetUSA){
            mapDataSetUSA[iso].fillColor = paletteScale(mapDataSetUSA[iso].numberOfThings);
        }    
        mapLargeUSA.updateChoropleth(mapDataSetUSA, {reset: true});
    }
}

function clearMaps(){
    mapDataSet = {};
    mapDataSetUSA = {};
    mapMinValue = 0;
    mapMaxValue = 0;
    mapMinValueUSA = 0;
    mapMaxValueUSA = 0;
    mapLargeWorld.updateChoropleth(mapDataSet, {reset: true});
    mapLargeUSA.updateChoropleth(mapDataSetUSA, {reset: true});
}