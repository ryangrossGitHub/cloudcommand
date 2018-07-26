var scatterCircleGraphWidth = 420;
var scatterCircleGraphHeight = 420;

var deviceScatterGraph = new Circos({
    container: '#circleScatterGraph',
    width: scatterCircleGraphWidth,
    height: scatterCircleGraphHeight,
});


var scatterCircleGraphInstanceArray = [];

var deviceScatterData = [];

function startScatterGraphAnimations() {
  var centers = document.getElementsByClassName("scatterCircleCenter");
  for(var c=0; c<centers.length; c++){
    centers[c].style.display = "block";
  }

    deviceScatterGraph
      .layout(
        scatterCircleGraphInstanceArray,
        {
          innerRadius: scatterCircleGraphWidth / 2 - 40,
          outerRadius: scatterCircleGraphWidth / 2 - 38,
          ticks: {display: false},
          labels: {
            position: 'center',
            display: true,
            size: 14,
            color: '#ffffff',
            radialOffset: 15
          }
        }
      ).render()
}

function pushScatterCircleGraphData(id, value, code, type){
  deviceScatterData.push({
    block_id: id,
    position: (Math.random() * 98)+2,
    value: value/1000,
    code: code
  });

  if(deviceScatterData.length > 2000){
      deviceScatterData.shift();
  }
}

function drawScatterCircleGraph(){
  drawCircos(deviceScatterData);
}

function clearScatterCircleGraph(){
  deviceScatterData = [];
  drawCircos(deviceScatterData, true);
}

function drawCircos(deviceScatterData, clear) {
    if(deviceScatterData.length == 0 && (clear == undefined || !clear)){
      return;
    }
     deviceScatterGraph.scatter('circleScatterGraph', deviceScatterData, {
        innerRadius: 0.2,
        outerRadius: 0.98,
        logScale: false,
        fill: true,
        size: 0.75,
        strokeColor: function(data, index) {
          if(data.code == 4){
            return '#ff7b00';
          }else if(data.code == 5){
            return '#ff0000';
          }else {
            return '#ffffff';
          }
        },
        axes: [
            {
              color: '#00adef',
              position: 0.1,
              opacity: 0.5,
              thickness: 0.5
            },
            {
              color: '#00adef',
              position: 0.15,
              opacity: 0.5,
              thickness: 0.5
            },
            {
              color: '#00adef',
              position: 0.2,
              opacity: 0.5,
              thickness: 0.5
            },
            {
              color: '#00adef',
              position: 0.25,
              opacity: 0.5,
              thickness: 0.5
            },
            {
              color: '#00adef',
              position: 0.3,
              opacity: 0.5,
              thickness: 0.5
            },
            {
              color: '#00adef',
              position: 0.35,
              opacity: 0.5,
              thickness: 0.5
            },
            {
              color: '#00adef',
              position: 0.4,
              opacity: 0.5,
              thickness: 0.5
            },
            {
              color: '#00adef',
              position: 0.45,
              opacity: 0.5,
              thickness: 0.5
            },
            {
              color: '#00adef',
              position: 0.5,
              opacity: 0.5,
              thickness: 0.5
            },
            {
              color: '#00adef',
              position: 0.55,
              opacity: 0.5,
              thickness: 0.5
            },
            {
              color: '#00adef',
              position: 0.6,
              opacity: 0.5,
              thickness: 0.5
            },
            {
              color: '#00adef',
              position: 0.65,
              opacity: 0.5,
              thickness: 0.5
            },
            {
              color: '#00adef',
              position: 0.7,
              opacity: 0.5,
              thickness: 0.5
            },
            {
              color: '#00adef',
              position: 0.75,
              opacity: 0.5,
              thickness: 0.5
            },
            {
              color: '#00adef',
              position: 0.8,
              opacity: 0.5,
              thickness: 0.5
            },
            {
              color: '#00adef',
              position: 0.85,
              opacity: 0.5,
              thickness: 0.5
            },
            {
              color: '#00adef',
              position: 0.9,
              opacity: 0.5,
              thickness: 0.5
            },
            {
              color: '#00adef',
              position: 0.95,
              opacity: 0.5,
              thickness: 0.5
            },
            {
              color: '#00adef',
              position: 1,
              opacity: 0.5,
              thickness: 1
            },
            {
              color: '#1F4B64',
              position: 1.2,
              opacity: 0.7,
              thickness: 0.5
            },
            {
              color: '#1F4B64',
              position: 1.25,
              opacity: 0.7,
              thickness: 0.5
            },
            {
              color: '#1F4B64',
              position: 1.3,
              opacity: 0.7,
              thickness: 0.5
            },
            {
              color: '#1F4B64',
              position: 1.35,
              opacity: 0.7,
              thickness: 0.5
            },
            {
              color: '#1F4B64',
              position: 1.4,
              opacity: 0.7,
              thickness: 0.5
            },
            {
              color: '#1F4B64',
              position: 1.45,
              opacity: 0.7,
              thickness: 0.5
            },
            {
              color: '#1F4B64',
              position: 1.5,
              opacity: 0.7,
              thickness: 0.5
            },
            {
              color: '#1F4B64',
              position: 1.55,
              opacity: 0.7,
              thickness: 0.5
            },
            {
              color: '#1F4B64',
              position: 1.6,
              opacity: 0.7,
              thickness: 0.5
            },
            {
              color: '#1F4B64',
              position: 1.65,
              opacity: 0.7,
              thickness: 0.5
            },
            {
              color: '#1F4B64',
              position: 1.7,
              opacity: 0.7,
              thickness: 0.5
            },
            {
              color: '#1F4B64',
              position: 1.75,
              opacity: 0.7,
              thickness: 0.5
            },
            {
              color: '#1F4B64',
              position: 1.8,
              opacity: 0.7,
              thickness: 0.5
            },
            {
              color: '#182B38',
              position: 2,
              opacity: 1,
              thickness: 0.5
            },
            {
              color: '#182B38',
              position: 3,
              opacity: 1,
              thickness: 0.5
            },
            {
              color: '#182B38',
              position: 4,
              opacity: 1,
              thickness: 0.5
            },
            {
              color: '#182B38',
              position: 5,
              opacity: 1,
              thickness: 0.5
            },
            {
              color: '#182B38',
              position: 6,
              opacity: 1,
              thickness: 0.5
            },
            {
              color: '#182B38',
              position: 7,
              opacity: 1,
              thickness: 0.5
            },
            {
              color: '#182B38',
              position: 8,
              opacity: 1,
              thickness: 0.5
            },
            {
              color: '#182B38',
              position: 9,
              opacity: 1,
              thickness: 0.5
            },
            {
              color: '#182B38',
              position: 10,
              opacity: 1,
              thickness: 0.5
            },
            {
              color: '#182B38',
              position: 30,
              opacity: 1,
              thickness: 0.5
            },
            {
              color: '#182B38',
              position: 60,
              opacity: 1,
              thickness: 0.5
            },
            {
              color: '#182B38',
              position: 300,
              opacity: 1,
              thickness: 0.5
            },
          ]
      })
      .render()
}