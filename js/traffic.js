var trafficPointCount = 0;

function addTrafficEvent(id, connection){
    var lat = round(connection.lat, 0.5);
    var lon = round(connection.lon, 0.5);
    if(newConnectionQueue[lat+"|"+lon] == undefined){
        newConnectionQueue[lat+"|"+lon] = {};
        newConnectionQueue[lat+"|"+lon].lat = connection.lat;
        newConnectionQueue[lat+"|"+lon].lon = connection.lon;
        newConnectionQueue[lat+"|"+lon]['4xx'] = 0;
        newConnectionQueue[lat+"|"+lon]['5xx'] = 0;
        newConnectionQueue[lat+"|"+lon]['123'] = 0;
        newConnectionQueue[lat+"|"+lon].total = 0;
        newConnectionQueue[lat+"|"+lon].devices = {};
    }
    
    if(newConnectionQueue[lat+"|"+lon].devices[id] == undefined){
        newConnectionQueue[lat+"|"+lon].devices[id] = {};
        newConnectionQueue[lat+"|"+lon].devices[id]['4xx'] = 0;
        newConnectionQueue[lat+"|"+lon].devices[id]['5xx'] = 0;
        newConnectionQueue[lat+"|"+lon].devices[id]['123'] = 0;
        newConnectionQueue[lat+"|"+lon].devices[id].total = 0;
    }

    for(var i=0; i<connection.details.length; i++){
        newConnectionQueue[lat+"|"+lon].total++;
        newConnectionQueue[lat+"|"+lon].devices[id].total++;

        if(connection.details[i].responseCode.charAt(0) == '4'){
            newConnectionQueue[lat+"|"+lon]['4xx']++;
            newConnectionQueue[lat+"|"+lon].devices[id]['4xx']++;
        }else if(connection.details[i].responseCode.charAt(0) == '5'){
            newConnectionQueue[lat+"|"+lon]['5xx']++;
            newConnectionQueue[lat+"|"+lon].devices[id]['5xx']++;
        }else{
            newConnectionQueue[lat+"|"+lon]['123']++;
            newConnectionQueue[lat+"|"+lon].devices[id]['123']++;
        }
    }

    if(newConnectionQueue[lat+"|"+lon].total > trafficCountHigh){
        trafficCountHigh = newConnectionQueue[lat+"|"+lon].total;
    }

    //Set point and line color
    // var highestResponseCode = newConnectionQueue[id][lat+"|"+lon]['123'];
    // newConnectionQueue[id][lat+"|"+lon].responseCode = "";

    // if( newConnectionQueue[id][lat+"|"+lon]['4xx'] > highestResponseCode/4){ //if 4xx accounts for more than 25% of 123
    //     highestResponseCode =  newConnectionQueue[id][lat+"|"+lon]['4xx'];
    //     newConnectionQueue[id][lat+"|"+lon].responseCode = "4";
    // }
    // if( newConnectionQueue[id][lat+"|"+lon]['5xx'] > highestResponseCode){ //if 5xx is more than 4xx
    //     highestResponseCode =  newConnectionQueue[id][lat+"|"+lon]['5xx'];
    //     newConnectionQueue[id][lat+"|"+lon].responseCode = "5";
    // }

    trafficPointCount++;
    trafficConnectionCount += connection.details.length;

    //Update heat map
    // if(heatMapHistory[connection.lat+connection.lon] == undefined){
    //     heatMapHistory[connection.lat+connection.lon] = {};
    //     heatMapHistory[connection.lat+connection.lon].lat = parseInt(connection.lat);
    //     heatMapHistory[connection.lat+connection.lon].lon = parseInt(connection.lon);
    //     heatMapHistory[connection.lat+connection.lon].count = connection.count;
    // }else{
    //     heatMapHistory[connection.lat+connection.lon].count += connection.count;
    // }

    // if(heatMapHigh < heatMapHistory[connection.lat+connection.lon].count){
    //     heatMapHigh = heatMapHistory[connection.lat+connection.lon].count;
    // }

    // heatMapTotal += connection.count;

    // if(heatMapAverage == 0){
    //     heatMapAverage = connection.count;
    // }else{
    //     heatMapAverage -= heatMapAverage / Object.keys(heatMapHistory).length;
    //     heatMapAverage += heatMapHistory[connection.lat+connection.lon].count / Object.keys(heatMapHistory).length;
    // }

    // heatMapAverage = Math.floor(heatMapAverage);
}

function showTraffic(){
    var x,y,z;
    var objectMesh;
    var start,end;
    var phi,theta;
    var geometry;
    var materialIndex;
    var pointSize;

    var geoPoint = new THREE.Geometry();
    var point = new THREE.Mesh();

    var geoLine123 = new THREE.Geometry();
    var geoLine4xx = new THREE.Geometry();
    var geoLine5xx = new THREE.Geometry();

    var material123 = new THREE.MeshLambertMaterial( { 
          color: 0xffffff,
          transparent:true, 
          opacity:0.9
    } );

    var material5xx = new THREE.MeshLambertMaterial( { 
          color: 'rgb(255, 20, 0)',
          transparent:true, 
          opacity:0.9
    } );

    var material4xx = new THREE.MeshLambertMaterial( { 
          color: 'rgb(255, 60, 0)',
          transparent:true, 
          opacity:0.9
    } );

    var lineMaterial123 =  new THREE.LineDashedMaterial({
        color: 0xffffff,
        scale: 1,
        dashSize: 3,
        gapSize: 2,
        transparent: true,
        opacity: 0.7
      });

      var lineMaterial4xx =  new THREE.LineDashedMaterial({
        color: 'rgb(255, 100, 0)',
        scale: 1,
        dashSize: 3,
        gapSize: 2,
        transparent: true,
        opacity: 0.7
      });

      var lineMaterial5xx =  new THREE.LineDashedMaterial({
        color: 'rgb(255, 30, 0)',
        scale: 1,
        dashSize: 3,
        gapSize: 2,
        transparent: true,
        opacity: 0.7
      });

    //Clear
    if(globe.scene.getObjectByName("trafficPointsMesh") != undefined){
      globe.scene.remove(globe.scene.getObjectByName("trafficPointsMesh"));
    }

    if(globe.scene.getObjectByName("trafficLineSegments123") != undefined){
      globe.scene.remove(globe.scene.getObjectByName("trafficLineSegments123"));
    }

    if(globe.scene.getObjectByName("trafficLineSegments4xx") != undefined){
      globe.scene.remove(globe.scene.getObjectByName("trafficLineSegments4xx"));
    }

    if(globe.scene.getObjectByName("trafficLineSegments5xx") != undefined){
      globe.scene.remove(globe.scene.getObjectByName("trafficLineSegments5xx"));
    }

    var lineDrawn = false;
    for(var coordinate in newConnectionQueue){
         //Get starting point
        phi = (90 - newConnectionQueue[coordinate].lat) * Math.PI / 180;
        theta = (180 - newConnectionQueue[coordinate].lon) * Math.PI / 180;

        x = globe.globeRadius * Math.sin(phi) * Math.cos(theta);
        y = globe.globeRadius * Math.cos(phi);
        z = globe.globeRadius * Math.sin(phi) * Math.sin(theta);

        start = new THREE.Vector3(x, y, z);

        //Calculate based off average
        pointSize = newConnectionQueue[coordinate].total - trafficConnectionCount/trafficPointCount;
        if(pointSize <= 1){
            pointSize = 1;
        }else{
            pointSize = Math.floor(scaleBetween(pointSize, 1, 10, 1, trafficCountHigh));
        }

        point.geometry = new THREE.SphereGeometry(pointSize, 10, 10 );
        point.position.x = x;
        point.position.y = y;
        point.position.z = z;
        point.lookAt(globe.globeMesh.position);
        point.updateMatrix();

        //Default to 123xx color (white)
        materialIndex = 0;

        //If 4xx is 25% or more off all traffic at this coordinate
        if(newConnectionQueue[coordinate]["4xx"]/newConnectionQueue[coordinate].total >= 0.25){ 
            materialIndex = 2; 
        }
        
        //If 5xx is 25% or more off all traffic at this coordinate and 5xx is greater than 4xx
        if((newConnectionQueue[coordinate]["5xx"]/newConnectionQueue[coordinate].total >= 0.25) && (newConnectionQueue[coordinate]["5xx"] > newConnectionQueue[coordinate]["4xx"])){ 
            materialIndex = 1; 
        }

        for(var f=0; f<point.geometry.faces.length; f++){
            point.geometry.faces[f].materialIndex = materialIndex;
        }

        geoPoint.merge(point.geometry, point.matrix);

        //Draw lines
        //Translate for arcs
        if(start.x<0){ start.x-=globe.regionOffset/1.5;}else{start.x+=globe.regionOffset/1.5;}
        if(start.y<0){ start.y-=globe.regionOffset/1.5;}else{start.y+=globe.regionOffset/1.5;}
        if(start.z<0){ start.z-=globe.regionOffset/1.5;}else{start.z+=globe.regionOffset/1.5;}
        for(var device in newConnectionQueue[coordinate].devices){
            lineDrawn = false;

            //Get ending point
            var objectMesh = globe.scene.getObjectByName(device);
            objectMesh.geometry.computeBoundingBox();

            var boundingBox = objectMesh.geometry.boundingBox;

            end = new THREE.Vector3();
            end.subVectors( boundingBox.max, boundingBox.min );
            end.multiplyScalar( 0.5 );
            end.add( boundingBox.min );
            end.applyMatrix4( objectMesh.matrixWorld );

            end = new THREE.Vector3(end.x, end.y, end.z);

            //If 4xx is 25% or more off all traffic at this coordinate going to this device
            if(newConnectionQueue[coordinate].devices[device]["4xx"]/newConnectionQueue[coordinate].devices[device].total >= 0.25){ 
                geoLine4xx = getArc(start, end, 50, geoLine4xx); 
                lineDrawn = true;
            }
            
            //If 5xx is 25% or more off all traffic at this coordinate going to this device and 5xx is greater than 4xx
            if((newConnectionQueue[coordinate].devices[device]["5xx"]/newConnectionQueue[coordinate].devices[device].total >= 0.25) && (newConnectionQueue[coordinate].devices[device]["5xx"] > newConnectionQueue[coordinate].devices[device]["4xx"])){ 
                geoLine5xx = getArc(start, end, 50, geoLine5xx); 
                lineDrawn = true;
            }

            if(!lineDrawn) { 
                geoLine123 = getArc(start, end, 50, geoLine123); 
            }
        }
    }

    var trafficPointsMesh = new THREE.Mesh(geoPoint, new THREE.MultiMaterial([
          material123,
          material5xx,
          material4xx
        ]));
    trafficPointsMesh.name = "trafficPointsMesh";
    globe.scene.add(trafficPointsMesh);

    var trafficLineSegments123 = new THREE.LineSegments( geoLine123, lineMaterial123 );
    trafficLineSegments123.updateMatrix();
    trafficLineSegments123.name = "trafficLineSegments123";
    globe.scene.add(trafficLineSegments123);

    var trafficLineSegments4xx = new THREE.LineSegments( geoLine4xx, lineMaterial4xx );
    trafficLineSegments4xx.updateMatrix();
    trafficLineSegments4xx.name = "trafficLineSegments4xx";
    globe.scene.add(trafficLineSegments4xx);

    var trafficLineSegments5xx = new THREE.LineSegments( geoLine5xx, lineMaterial5xx );
    trafficLineSegments5xx.updateMatrix();
    trafficLineSegments5xx.name = "trafficLineSegments5xx";
    globe.scene.add(trafficLineSegments5xx);

    trafficPointCount = 0;
    trafficConnectionCount = 0;
    trafficCountHigh = 0;
    newConnectionQueue = {};
  }

function getArc(pointStart, pointEnd, smoothness, geometry) {
    // calculate normal
    var cb = new THREE.Vector3(),
      ab = new THREE.Vector3(),
      normal = new THREE.Vector3();

    cb.subVectors(new THREE.Vector3(), pointEnd);
    ab.subVectors(pointStart, pointEnd);
    cb.cross(ab);
    normal.copy(cb).normalize();

    // get angle between vectors
    var angle = pointStart.angleTo(pointEnd);
    var angleDelta = angle / (smoothness - 1);
    
    var groundLevelStart = pointStart.clone();
    if(groundLevelStart.x>0){ groundLevelStart.x-=globe.regionOffset/2;}else{groundLevelStart.x+=globe.regionOffset/2;}
    if(groundLevelStart.y>0){ groundLevelStart.y-=globe.regionOffset/2;}else{groundLevelStart.y+=globe.regionOffset/2;}
    if(groundLevelStart.z>0){ groundLevelStart.z-=globe.regionOffset/2;}else{groundLevelStart.z+=globe.regionOffset/2;}
    geometry.vertices.push(groundLevelStart);

    for (var i = 1; i < smoothness; i++) {
      geometry.vertices.push(pointStart.clone().applyAxisAngle(normal, angleDelta * i));
    }

    return geometry;
  }

function scaleBetween(unscaledNum, minAllowed, maxAllowed, min, max) {
  return (maxAllowed - minAllowed) * (unscaledNum - min) / (max - min) + minAllowed;
}

function showTrafficDetails(ip){
    var point = globe.scene.getObjectByName(ip);

    var phi = (90 - parseInt(traffic[ip].lat)) * Math.PI / 180;
    var theta = (180 - parseInt(traffic[ip].lon)) * Math.PI / 180;

    var distanceTarget = 700;

    var x = (distanceTarget/1.55 * Math.sin(phi) * Math.cos(theta));
    var y = (distanceTarget/1.55 * Math.cos(phi));
    var z = (distanceTarget/1.55 * Math.sin(phi) * Math.sin(theta));

    globe.setCameraPosition(x, y, z);

    var colorClass = "successText";
    var colorMessage = "";

    document.getElementById('trafficBlockedCount').innerHTML = "";
    document.getElementById('trafficPorts').innerHTML = "";

    document.getElementById("trafficMap").src = googleMapsBaseUrl + "&q="+traffic[ip].lat+","+traffic[ip].lon+"&zoom=6&maptype=satellite";

    if(traffic[ip].blockedCount != undefined && traffic[ip].blockedCount > 0){
        colorClass = 'alertText';
        colorMessage = "(This IP has been blocked by other users!)";
        document.getElementById('trafficBlockedCount').innerHTML = '<span class="'+colorClass+'">Total Times Blocked: '+traffic[ip].blockedCount+'</span>';
    }

    for(var param in traffic[ip]){
        if(!isNaN(param)){
            if(param == "22"){
                colorClass = 'severeWarnText';
                colorMessage = "(Privledged Access Port 22 In Use)";
                document.getElementById('trafficPorts').innerHTML += "<div class='"+colorClass+"'>Port "+param+" Count: "+traffic[ip][param]+"</div>";
            }else{
                document.getElementById('trafficPorts').innerHTML += "<div>Port "+param+" Count: "+traffic[ip][param]+"</div>";
            }
        }
    }

    document.getElementById('trafficIp').innerHTML = '<span class="'+colorClass+'">'+ip+' '+colorMessage+'</span>';
    document.getElementById('trafficCountry').innerHTML = "Country: " + traffic[ip].country;
    document.getElementById('trafficStateProv').innerHTML = "State/Province: " + traffic[ip].state;
    document.getElementById('trafficCity').innerHTML = "City: " + traffic[ip].city;
    document.getElementById('trafficCoordinates').innerHTML = "Coordinates: " + traffic[ip].lat + "," + traffic[ip].lon;
    document.getElementById('trafficLocalTime').innerHTML = "Local Time: " + new Date();
    document.getElementById('detailsBodyMetrics').style.display = "none";
    document.getElementById('detailsBodyTraffic').style.display = "block";
    document.getElementById("paneMiddle").className += " openPane";
}