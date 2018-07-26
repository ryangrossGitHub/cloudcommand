var Globe = function() {
  var container = document.getElementById('container');
  var imagePath = 'images/';

  var camera, scene, renderer;
  var globeMesh, atmosphere;

  var overRenderer, zoomDamp;

  var globeRadius = 200;
  var curZoomSpeed = 0;
  var zoomSpeed = 50;
  var mouseDown = false;
  var extrudedRegion = null;
  var regionHover = null;
  var azSize = 13;
  var regionOffset = 15;
  var ec2Offset = regionOffset;
  var rdsOffset = 9;
  var elbOffset = regionOffset;

  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2();
  var mouseOnDown = { x: 0, y: 0 };
  var rotation = { x: 0, y: 0 },
      target = { x: Math.PI*3/2.5, y: Math.PI / 7.0 },
      targetOnDown = { x: 0, y: 0 };

  var distance = 100000, distanceTarget = 1000;
  var padding = 40;
  var PI_HALF = Math.PI / 2;

  var elementShadowIntensity = 2;
  var currentlyFocusedObject = null;
  var currentlyFocusedRelatedObjects = [];
  var clouds = {};

  var gridCanvas = document.createElement( 'canvas' );
  gridCanvas.width = 256;
  gridCanvas.height = 256;
  var gradient = gridCanvas.getContext( '2d' ).createLinearGradient(256, 0, 256, 256);
  gradient.addColorStop(0, "#0080ff");
  gradient.addColorStop(0.2, "#0065ff");
  gradient.addColorStop(0.5, "#0055ff");
  gradient.addColorStop(0.8, "#0065ff");
  gradient.addColorStop(1, "#0080ff");
  gridCanvas.getContext( '2d' ).fillStyle = gradient;
  gridCanvas.getContext( '2d' ).fillRect( 0, 0, 256, 256 );

  var runningTexture = new THREE.CanvasTexture( gridCanvas );

  var azTexture = createTexture('rgb(256,256,256)');

  var alertTexture = createTexture('rgb(256,0,0)');
  var warningTexture = createTexture('rgb(256,256,0)');
  var severeWarningTexture = createTexture('rgb(179, 71, 0)');
  var pendingTexture = createTexture('rgb(256,256,256)');
  var stoppedTexture = createTexture('rgb(50,50,50)');
  var stoppingTexture = stoppedTexture; //Same color except stopping will pulse
  var brightTexture = createTexture('rgb(0, 173, 239)');

  var materialOverlay = null;

  //Heat map materials
   var materialHeatMap1 = new THREE.MeshBasicMaterial( 
      { 
        color: 0xffffff,
        vertexColors: THREE.FaceColors,
        transparent: true, 
        side: THREE.BackSide,
        depthWrite: false, 
        depthTest: false,
        opacity:0.3
      });
       var materialHeatMap2 = new THREE.MeshBasicMaterial( 
      { 
        color: 0xffffff,
        vertexColors: THREE.FaceColors,
        transparent: true, 
        side: THREE.BackSide,
        depthWrite: false, 
        depthTest: false,
        opacity:0.4
      });
       var materialHeatMap3 = new THREE.MeshBasicMaterial( 
      { 
        color: 0xffffff,
        vertexColors: THREE.FaceColors,
        transparent: true, 
        side: THREE.BackSide,
        depthWrite: false, 
        depthTest: false,
        opacity:0.45
      });
       var materialHeatMap4 = new THREE.MeshBasicMaterial( 
      { 
        color: 0xffffff,
        vertexColors: THREE.FaceColors,
        transparent: true, 
        side: THREE.BackSide,
        depthWrite: false, 
        depthTest: false,
        opacity:0.5
      });
       var materialHeatMap5 = new THREE.MeshBasicMaterial( 
      { 
        color: 0xffffff,
        vertexColors: THREE.FaceColors,
        transparent: true, 
        side: THREE.BackSide,
        depthWrite: false, 
        depthTest: false,
        opacity:0.55
      });
       var materialHeatMap6 = new THREE.MeshBasicMaterial( 
      { 
        color: 0xffffff,
        vertexColors: THREE.FaceColors,
        transparent: true, 
        side: THREE.BackSide,
        depthWrite: false, 
        depthTest: false,
        opacity:0.6
      });
       var materialHeatMap7 = new THREE.MeshBasicMaterial( 
      { 
        color: 0xffffff,
        vertexColors: THREE.FaceColors,
        transparent: true, 
        side: THREE.BackSide,
        depthWrite: false, 
        depthTest: false,
        opacity:0.65
      });
       var materialHeatMap8 = new THREE.MeshBasicMaterial( 
      { 
        color: 0xffffff,
        vertexColors: THREE.FaceColors,
        transparent: true, 
        side: THREE.BackSide,
        depthWrite: false, 
        depthTest: false,
        opacity:0.7
      });
       var materialHeatMap9 = new THREE.MeshBasicMaterial( 
      { 
        color: 0xffffff,
        vertexColors: THREE.FaceColors,
        transparent: true, 
        side: THREE.BackSide,
        depthWrite: false, 
        depthTest: false,
        opacity:0.75
      });
       var materialHeatMap10 = new THREE.MeshBasicMaterial( 
      { 
        color: 0xffffff,
        vertexColors: THREE.FaceColors,
        transparent: true, 
        side: THREE.BackSide,
        depthWrite: false, 
        depthTest: false,
        opacity:0.8
      });

      var geometryHeatMap = new THREE.CircleGeometry(0.5,20);

      var meshHeatMap = new THREE.Mesh(
        geometryHeatMap, 
        new THREE.MultiMaterial([
          materialHeatMap1,
          materialHeatMap2,
          materialHeatMap3,
          materialHeatMap4,
          materialHeatMap5,
          materialHeatMap6,
          materialHeatMap7,
          materialHeatMap8,
          materialHeatMap9,
          materialHeatMap10
        ])
      );
    meshHeatMap.scale.set( 1.1, 1.1, 1.1 );

  var regionPivot = new THREE.Object3D();

  function init() {
    var shader, uniforms, material, geometry, intersects;  
    var objectToHighlight, objectToHighlightName;

    camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = distance;

    scene = new THREE.Scene();

    var lightTop = new THREE.PointLight( 0xffffff, 0.25, 1000000 );
    lightTop.position.set( 0, 10000, 0 );
    scene.add( lightTop );

    var lightBottom = new THREE.PointLight( 0xffffff, 0.25, 1000000 );
    lightBottom.position.set( 0, -10000, 0 );
    scene.add( lightBottom );


    var lightSide1 = new THREE.PointLight( 0xffffff, 2, 1000000 );
    lightSide1.position.set( 10000, 0, 0 );
    scene.add( lightSide1 );

    var lightSide2 = new THREE.PointLight( 0xffffff, 2, 1000000 );
    lightSide2.position.set( -10000, 0, 0 );
    scene.add( lightSide2 );

    var lightSide3 = new THREE.PointLight( 0xffffff, 2, 1000000 );
    lightSide3.position.set( 0, 0, 10000 );
    scene.add( lightSide3 );

    var lightSide4 = new THREE.PointLight( 0xffffff, 2, 1000000 );
    lightSide4.position.set( 0, 0, -10000 );
    scene.add( lightSide4 );

    scene.add(meshHeatMap);

    var geometry = new THREE.SphereGeometry(globeRadius, 100, 100);

    shader = Shaders['earth'];
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    uniforms['texture'].value = THREE.ImageUtils.loadTexture(imagePath+'earth_large-8192x4096.jpg');

    material = new THREE.ShaderMaterial({

          uniforms: uniforms,
          vertexShader: shader.vertexShader,
          fragmentShader: shader.fragmentShader,
          transparent: true,
          wireframe: false,
          depthWrite: false, 
          depthTest: false,
          opacity: 0.9

        });

    globeMesh = new THREE.Mesh(geometry, material);
    globeMesh.rotation.y = Math.PI;
    globeMesh.name = "globe";
    scene.add(globeMesh);

    material = new THREE.MeshBasicMaterial({

          map: brightTexture,
          transparent: true,
          wireframe: true,
          depthWrite: false, 
          depthTest: false,
          opacity: 0.02

        });

    var geometryGlobeUnderlay = new THREE.SphereGeometry(globeRadius - 1, 100, 100);
    var meshGlobeUnderlay = new THREE.Mesh( geometryGlobeUnderlay, material );
    meshGlobeUnderlay.name = "meshGlobeUnderlay";
    scene.add(meshGlobeUnderlay);

    var shadersOverlay = ShadersOverlay['earth'];
    var uniformsOverlay = THREE.UniformsUtils.clone(shadersOverlay.uniforms);

    uniformsOverlay['texture'].value = THREE.ImageUtils.loadTexture(imagePath+'stars.jpg');

    materialOverlay = new THREE.ShaderMaterial({

          uniforms: uniformsOverlay,
          vertexShader: shadersOverlay.vertexShader,
          fragmentShader: shadersOverlay.fragmentShader,
          transparent: true,
          wireframe: false,
          // depthWrite: false, 
          // depthTest: false,
          side: THREE.BackSide,
          opacity: 0.2

        });

    var geometryOverlay = new THREE.SphereGeometry(globeRadius + 400, 20, 20);
    var globeMeshOverlay = new THREE.Mesh(geometryOverlay, materialOverlay);
    globeMeshOverlay.rotation.y = Math.PI;
    globeMeshOverlay.name = "globeOverlay";
    scene.add(globeMeshOverlay);

    //Add Regions
    var materialRegion = new THREE.MeshBasicMaterial( 
      { 
        map: pendingTexture, 
        transparent: true, 
        side: THREE.DoubleSide,
        depthWrite: false, 
        depthTest: false,
        opacity:0.2
      });

      clouds.aws = {};

      // 'us-east-1'      //N. Virginia
      // 'us-east-2'      //Ohio
      // 'us-west-1'      //N. California
      // 'us-west-2'      //Oregon
      // 'ca-central-1'   //Canada (Central)
      // 'eu-west-1'      //Ireland
      // 'eu-central-1'   //Frankfurt
      // 'eu-west-2'      //London
      // 'ap-northeast-1' //Tokyo
      // 'ap-northeast-2' //Seoul
      // 'ap-southeast-1' //Singapore
      // 'ap-southeast-2' //Syndney
      // 'ap-south-1'     //Mumbai
      // 'sa-east-1'       //Sao Paulo

      clouds.aws.regions = {};
      clouds.aws.regions["us-east-1"] = {"lat":37, "lon":-77, "pivot":new THREE.Object3D(), "point":new THREE.Geometry()};
      clouds.aws.regions["us-east-2"] = {"lat":40, "lon":-83, "pivot":new THREE.Object3D(), "point":new THREE.Geometry()};
      clouds.aws.regions["us-west-1"] = {"lat":44, "lon":-120, "pivot":new THREE.Object3D(), "point":new THREE.Geometry()};
      clouds.aws.regions["us-west-2"] = {"lat":39, "lon":-122, "pivot":new THREE.Object3D(), "point":new THREE.Geometry()};
      clouds.aws.regions["ca-central-1"] = {"lat":46, "lon":-75, "pivot":new THREE.Object3D(), "point":new THREE.Geometry()};
      clouds.aws.regions["eu-west-1"] = {"lat":53, "lon":-8, "pivot":new THREE.Object3D(), "point":new THREE.Geometry()};
      clouds.aws.regions["eu-west-2"] = {"lat":51.5, "lon":0, "pivot":new THREE.Object3D(), "point":new THREE.Geometry()};
      clouds.aws.regions["eu-central-1"] = {"lat":50, "lon":8.5, "pivot":new THREE.Object3D(), "point":new THREE.Geometry()};
      clouds.aws.regions["ap-northeast-1"] = {"lat":35.7, "lon":139.7, "pivot":new THREE.Object3D(), "point":new THREE.Geometry()};
      clouds.aws.regions["ap-northeast-2"] = {"lat":37.5, "lon":127, "pivot":new THREE.Object3D(), "point":new THREE.Geometry()};
      clouds.aws.regions["ap-southeast-1"] = {"lat":1.3, "lon":104, "pivot":new THREE.Object3D(), "point":new THREE.Geometry()};
      clouds.aws.regions["ap-southeast-2"] = {"lat":-33.8, "lon":150, "pivot":new THREE.Object3D(), "point":new THREE.Geometry()};
      clouds.aws.regions["ap-south-1"] = {"lat":19, "lon":73, "pivot":new THREE.Object3D(), "point":new THREE.Geometry()};
      clouds.aws.regions["sa-east-1"] = {"lat":-23.5, "lon":-46.5, "pivot":new THREE.Object3D(), "point":new THREE.Geometry()};
      
      for(var c in clouds){
        for(var r in clouds[c].regions){
          addRegion(clouds[c].regions[r].lat, clouds[c].regions[r].lon,
            materialRegion, r);
        }
      } 

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.domElement.style.position = 'absolute';

    container.appendChild(renderer.domElement);

    container.addEventListener('mousedown', onMouseDown, false);

    container.addEventListener('dblclick', enhance, false);

    container.addEventListener('mousewheel', onMouseWheel, false);

    document.addEventListener('keydown', onDocumentKeyDown, false);

    document.addEventListener('keyup', onDocumentKeyUp, false);

    window.addEventListener('resize', onWindowResize, false);

    container.addEventListener('mouseover', function() {
      container.style.cursor = 'all-scroll';
      overRenderer = true;
    }, false);

    container.addEventListener('mouseout', function() {
      overRenderer = false;
    }, false);
  }

  function updateHeatMap(){
    if(scene.getObjectByName("heatMapMesh") != undefined){
      scene.remove(scene.getObjectByName("heatMapMesh"));
    }

      var phi = null;
      var theta = null;
      var geo = new THREE.Geometry();
      var point = new THREE.Mesh(geometryHeatMap);
      var heat = 0;
      var unAdjustedHeat = 0;

      //Add a square at every coordinate
      for(var heatMapObject in heatMapHistory){
        unAdjustedHeat = heatMapHistory[heatMapObject].count - heatMapAverage;

        if(unAdjustedHeat < 1){
          unAdjustedHeat = 1;
        }

        heat = Math.floor(scaleBetween(unAdjustedHeat, 1, 99, 1, heatMapHigh))/100;
        phi = (90 - heatMapHistory[heatMapObject].lat) * Math.PI / 180;
        theta = (180 - heatMapHistory[heatMapObject].lon) * Math.PI / 180;

        point.position.x = globeRadius * Math.sin(phi) * Math.cos(theta);
        point.position.y = globeRadius * Math.cos(phi);
        point.position.z = globeRadius * Math.sin(phi) * Math.sin(theta);
        point.lookAt(globeMesh.position);
        point.updateMatrix();

        for(var f=0; f<point.geometry.faces.length; f++){
          // point.geometry.faces[f].color.setRGB(0, 255, 255); //For adding color
          point.geometry.faces[f].materialIndex = Math.floor(heat*10);
        }
        
        geo.merge(point.geometry, point.matrix);
      }

      var meshes = new THREE.Mesh(
        geo, 
        new THREE.MultiMaterial([
          materialHeatMap1,
          materialHeatMap2,
          materialHeatMap3,
          materialHeatMap4,
          materialHeatMap5,
          materialHeatMap6,
          materialHeatMap7,
          materialHeatMap8,
          materialHeatMap9,
          materialHeatMap10
        ])
      );
      meshes.name = "heatMapMesh";
      scene.add(meshes);
  }

    function addRegion(lat, lon, material, name){
      var phi = (90 - lat) * Math.PI / 180;
      var theta = (180 - lon) * Math.PI / 180;
      var size = 1;

      clouds.aws.regions[name].pivot.applyMatrix(new THREE.Matrix4().makeTranslation(0,0,-regionOffset));

      var geometry = new THREE.PlaneGeometry(0,0,1);
      geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,0,-regionOffset));

      var regionMesh = new THREE.Mesh(geometry, material);

      regionMesh.position.x = globeRadius * Math.sin(phi) * Math.cos(theta);
      regionMesh.position.y = globeRadius * Math.cos(phi);
      regionMesh.position.z = globeRadius * Math.sin(phi) * Math.sin(theta);
      regionMesh.scale.z = Math.max( size, 0.1 );
      regionMesh.lookAt(globeMesh.position);
      regionMesh.name = name;
      regionMesh.type = "region";

      scene.add(regionMesh);
      regionMesh.add(clouds.aws.regions[name].pivot);

      var conePivot = new THREE.Object3D();
      conePivot.applyMatrix(new THREE.Matrix4().makeTranslation(0,0,regionOffset/2));
      clouds.aws.regions[name].pivot.add(conePivot);

      geometry = new THREE.ConeGeometry( 3, regionOffset, 4, 1, true, Math.PI/4, 2 * Math.PI );
      var materialCone = new THREE.MeshBasicMaterial( 
        { 
          map: pendingTexture, 
          transparent: true, 
          depthWrite: false, 
          depthTest: false,
          opacity:0.3
        });
      var regionConeMesh = new THREE.Mesh(geometry, materialCone);
      regionConeMesh.name = name+"Cone";
      scene.add(regionConeMesh);
      
      conePivot.add(regionConeMesh);
      conePivot.rotation.x += PI_HALF;

      geometry = new THREE.PlaneGeometry(1,1,1);
      geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,0,-regionOffset - 2));

      var regionPlaneMesh = new THREE.Mesh(geometry, material);
      regionMesh.add(regionPlaneMesh);
    }

  function populateRegion(region) {
    var gridSize = 4;
    var regionGrid = [];

    //Get list of objects for each layer
    for(var type in inventory){
      for(var id in inventory[type]){
        if(inventory[type][id].Region == region){
          regionGrid.push(inventory[type][id]);
        }
      }
    }

    var gridHeight = Math.ceil(Math.sqrt(regionGrid.length));
    var gridWidth = Math.round(Math.sqrt(regionGrid.length));

    var regionObject = scene.getObjectByName(region);
    var regionHeight = (gridHeight) * gridSize;
    var regionWidth = (gridWidth) * gridSize;

    var gridX = 0;
    var gridXmax = 0;
    var gridY = 0;
    var gridYmax = 0;
    var fillIn = false; //Used to fill other half of grid to avoid stair look
    var n, i;
    var found;
    var x = 0;
    var y = 0;
    for(n=0; n<regionGrid.length; n++){
      found = false;

      if(gridWidth == 1){
        x = gridX * gridSize - ((gridWidth * gridSize) - gridSize);
      }else{
        x = gridX * gridSize - ((gridWidth * gridSize) - gridSize)/2;
      }

      if(gridHeight == 1){
        y = gridY * gridSize - ((gridHeight * gridSize) - gridSize);
      }else{
        y = gridY * gridSize - ((gridHeight * gridSize) - gridSize)/2;
      }
      for(i=0; i<regionObject.children[0].children.length; i++){
        //Already exists
        if(regionObject.children[0].children[i].name == regionGrid[n].id){
          regionObject.children[0].children[i].position.x = x;
          regionObject.children[0].children[i].position.y = y;

          found = true;
          break;
        }
      }

      if(!found){
        createNewObject(regionGrid[n], x, y);
      }

      if(gridX > gridXmax){
        gridXmax = gridX;
      }

      if(gridY > gridYmax){
        gridYmax = gridY;
      }

      if(gridY > gridX){
        if(!fillIn){
          gridX++;
          gridY = 0;
        }else{
          if(gridY == gridX+1){
            fillIn = false;
            gridX++;
            gridY = 0;
          }else{
            gridX++;
          }
        }
      }else if(gridY < gridX){
        gridY++;
      }else if(gridY == gridX){
        if(!fillIn){
          gridY++;
          gridX = 0;
          fillIn = true;
        }
      }
    }
    
    if(regionWidth < 4){regionWidth = 4;}
    if(regionHeight < 4){regionHeight = 4;}
    regionObject.children[1].scale.set(regionWidth+2,regionHeight+2,1);
  }

  function createNewObject(data, x, y){
    var size;
    var geometry;

    var material = new THREE.MeshLambertMaterial( { 
      map: determineTextureFromData(data), 
      transparent:true, 
      side: THREE.DoubleSide,
      opacity:0.9
    } );

    if(data.type == "elb"){
      size = 1;
      geometry = new THREE.Geometry();

      material.wireframe = true;

      var geometryLB = new THREE.OctahedronGeometry( 1.4, 2 );
      geometryLB.applyMatrix(new THREE.Matrix4().makeTranslation(0,0,-2.5));
      var meshLB = new THREE.Mesh(geometryLB, material);

      var width = 0;
      var height = 0;
      var xOffset = {"left":0,"center":0,"right":0};
      var yOffset = {"left":0,"center":0,"right":0};

      width = 0.1;
      height = 0.6;
      
      yOffset.center = -1.4;

      yOffset.left = yOffset.center;
      yOffset.right = yOffset.center;
      xOffset.left = 0.8;
      xOffset.right = -0.8;

      var geometryExitCenter = new THREE.BoxGeometry(width,height,0.5);
      geometryExitCenter.applyMatrix(new THREE.Matrix4().makeTranslation(xOffset.center,yOffset.center,-2.5));
      var meshExitCenter = new THREE.Mesh(geometryExitCenter, material);

      var geometryExitLeft = new THREE.BoxGeometry(width,height,0.5);
      geometryExitLeft.applyMatrix(new THREE.Matrix4().makeTranslation(xOffset.left,yOffset.left,-2.5));
      var meshExitLeft = new THREE.Mesh(geometryExitLeft, material);

      var geometryExitRight = new THREE.BoxGeometry(width,height,0.5);
      geometryExitRight.applyMatrix(new THREE.Matrix4().makeTranslation(xOffset.right,yOffset.right,-2.5));
      var meshExitRight = new THREE.Mesh(geometryExitRight, material);

      var geometryEntrance = new THREE.BoxGeometry(width,height,0.5);
      geometryEntrance.applyMatrix(new THREE.Matrix4().makeTranslation(-xOffset.center,-yOffset.center,-2.5));
      var meshEntrance = new THREE.Mesh(geometryEntrance, material);

      geometry.merge(meshLB.geometry, meshLB.matrix);
      geometry.merge(meshExitCenter.geometry, meshExitCenter.matrix);
      geometry.merge(meshExitLeft.geometry, meshExitLeft.matrix);
      geometry.merge(meshExitRight.geometry, meshExitRight.matrix);
      geometry.merge(meshEntrance.geometry, meshEntrance.matrix);
    }else if(data.type == "apigateway"){
      size = 3;
      geometry = new THREE.TorusGeometry( 1.5, 0.2, 10, 28 );
      geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,0,-0.5));
      material.wireframe = true;
    }
    
    var mesh = new THREE.Mesh(geometry, material);

    mesh.scale.z = Math.max( size, 0.1 );
    mesh.lookAt(globeMesh.position);
    mesh.name = data.id;
    mesh.type = data.type;

    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = 0;

    scene.add(mesh);
    if(data.Region != undefined){
      clouds.aws.regions[data.Region].pivot.add(mesh);
    }
    inventory[data.type][data.id].mesh = mesh;
    scene.updateMatrixWorld(true);
  }

  function createTexture(color) {
      var canvas = document.createElement( 'canvas' );
      canvas.width = 256;
      canvas.height = 256;
      canvas.getContext( '2d' ).fillStyle = color;
      canvas.getContext( '2d' ).fillRect( 0, 0, 256, 256 );
      return new THREE.CanvasTexture( canvas );
  }

  function enhance(){
    new Audio("sounds/Tick-DeepFrozenApps-397275646.mp3").play();
    document.getElementById("enhanceFrame").style.display = "block";
    
    setTimeout(function(){
      document.getElementById("enhanceFrame").style.display = "none";
      zoom((distanceTarget-210)/1.5);
    }, 100);
  }

  function zoomReset(){
    setTimeout(function(){
      distanceTarget = 1000;
    }, 100);
  }

  function onMouseDown(event) {
    event.preventDefault();

    mouseDown = true;

    container.addEventListener('mousemove', onMouseMove, false);
    container.addEventListener('mouseup', onMouseUp, false);
    container.addEventListener('mouseout', onMouseOut, false);

    mouseOnDown.x = - event.clientX;
    mouseOnDown.y = event.clientY;

    targetOnDown.x = target.x;
    targetOnDown.y = target.y;
  }

  function onMouseMove(event) {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    if(mouseDown){
      zoomDamp = distance/1000;

      target.x = targetOnDown.x + ((- event.clientX) - mouseOnDown.x) * 0.005 * zoomDamp;
      target.y = targetOnDown.y + ((event.clientY) - mouseOnDown.y) * 0.005 * zoomDamp;

      target.y = target.y > PI_HALF ? PI_HALF : target.y;
      target.y = target.y < - PI_HALF ? - PI_HALF : target.y;
    }
  }

  function onMouseUp(event) {
    mouseDown = false;
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
  }

  function onMouseOut(event) {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
  }

  function onMouseWheel(event) {
    event.preventDefault();

    if (overRenderer) {
      zoom(event.wheelDeltaY * 0.3);
    }
    return false;
  }

  function onDocumentKeyDown(event) {
    switch (event.keyCode) {
      case 13:
        if(document.activeElement.id == "password"){
          loginAndLoadInventory();
        }
        event.preventDefault();
        break;
      case 16:
        holdingShift = true;
        event.preventDefault();
        break;
      case 17:
        toggleRotate();
        event.preventDefault();
        break;
      case 18:
        holdingAlt = true;
        event.preventDefault();
        break;
      case 37:
        if(holdingAlt){
          target.x -= 3;
        }else{
          target.x -= 0.1;
        }
        event.preventDefault();
        break;
      case 38:
        if(holdingShift){ 
          target.y += 0.05;
          target.y = target.y > PI_HALF ? PI_HALF : target.y;
          target.y = target.y < - PI_HALF ? - PI_HALF : target.y;
        }else{
          zoom(20);
        }
        event.preventDefault();
        break;
      case 39:
        if(holdingAlt){
          target.x += 3;
        }else{
          target.x += 0.1;
        }
        event.preventDefault();
        break;
      case 40:
        if(holdingShift){ 
          target.y -= 0.05;
          target.y = target.y > PI_HALF ? PI_HALF : target.y;
          target.y = target.y < - PI_HALF ? - PI_HALF : target.y;
        }else{
          zoom(-20);
        }
        event.preventDefault();
        break;
      default:
        // if(document.activeElement.tagName != "input"){
        //   document.getElementById("inventoryFilter").focus();
        // }
        new Audio("sounds/Pen_Clicks-Simon_Craggs-514025171.mp3").play();
        break;
    }
  }

  function timeWarpSpinMove(n){
    if(n == undefined){ 
      n = 20;
    }else{
      n--;
    }

    if(n == 0){
      startRotation();
      return;
    }

    setTimeout(function(){
      target.x += n/3;
      timeWarpSpinMove(n);
    },10);
  }

  function onDocumentKeyUp(event) {
    switch (event.keyCode) {
      case 16:
        holdingShift = false;
        event.preventDefault();
        break;
      case 18:
        holdingAlt = false;
        event.preventDefault();
        break;
    }
  }

  function onWindowResize( event ) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  function zoom(delta) {
    if(delta > 0){
      slidePanes("out");
      stopRotation();
    }else{
      slidePanes("in");
    }

    distanceTarget -= delta;
    distanceTarget = distanceTarget > 1000 ? 1000 : distanceTarget;
    distanceTarget = distanceTarget < 210 ? 210 : distanceTarget;
  }

  function animate() {
      setInterval( function () {
          requestAnimationFrame( render );
      }, 1000 / 60 );
  }

  function render() {
    rotation.x += (target.x - rotation.x) * 0.1;
    rotation.y += (target.y - rotation.y) * 0.1;
    distance += (distanceTarget - distance) * 0.3;

    camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
    camera.position.y = distance * Math.sin(rotation.y);
    camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);

    camera.lookAt(globeMesh.position);

    if(rotate){
      target.x -= 0.0010;
    }

    renderer.render(scene, camera);
    frames++;
  }

  function runLoginAnimation(){
    scene.getObjectByName("globe").material.depthWrite = true;
    scene.getObjectByName("globe").material.depthTest = true;
    scene.getObjectByName("globeOverlay").visible = false;
  }

  function determineTextureFromData(data){
    if(data.health == "fail"){
      return alertTexture;
    }else{
      if(data.status == "running"){
        if(data.cpu != undefined && data.cpu.Average != undefined){
          if((data.cpu.Average >= 0) && (data.cpu.Average < 75)){
            return runningTexture;
          }else if((data.cpu.Average >= 75) && (data.cpu.Average < 90)){
            return warningTexture;
          }else{ //Above 90 or below 0
            return severeWarningTexture;
          }
        }else{
          return runningTexture;
        }
      }else if(data.status == "pending" || data.status == "rebooting" || data.status == "creating"){
        return pendingTexture;
      }else if(data.status == "stopped"){
        return stoppedTexture;
      }else if(data.status == "stopping" || data.status == "shutting-down"){
        return stoppingTexture;
      }
    }
  }

  function setCameraPosition(x, y, z){
    var done = true;

    distanceTarget = 1000;

    if((Math.abs(camera.position.x - x) > 500) || ((z>0 && camera.position.z<0) || (z<0 && camera.position.z>0))){
      target.x -= 0.03;
      done = false;
    }else if((Math.abs(camera.position.x - x) > 400) || ((z>0 && camera.position.z<0) || (z<0 && camera.position.z>0))){
      target.x -= 0.01;
      done = false;
    }else if((Math.abs(camera.position.x - x) > 100) || ((z>0 && camera.position.z<0) || (z<0 && camera.position.z>0))){
      target.x -= 0.001;
      done = false;
    }

    if(Math.abs(camera.position.y - y) > 100){
      if(camera.position.y < y){
        target.y += 0.01;
      }else{
        target.y -= 0.01;
      }
      done = false;
    }

    if(done){
      stopRotation();
    }else{
      setTimeout(function(){
        setCameraPosition(x, y, z);
      },10);
    }
  }

  function load(type, data){
    if(data.length > 0){
      window.data = data;
      var globeObjects = [];
      var objectUpdated = false;
      var trafficEvents = false;
      var inventoryEvents = false;
      for(var i=0; i<data.length; i++){
        if(type == "billing"){
          var date = new Date();
          var m = month[date.getMonth()];
          document.getElementById("billingTotal").innerHTML = "$"+data[i]+" ("+m+")";
        }else if(type == "traffic"){
          trafficEvents = true;
          for(var c=0; c<data[i].connections.length; c++){
            addTrafficEvent(data[i].id, data[i].connections[c]);
          }
        }else{
          inventoryEvents = true;

          //Translate Objects
          if(data[i].type == "apigateway"){
            data[i] = translateApiGateway(data[i]);
          }else if(data[i].type == "elb"){
            data[i] = translateElb(data[i]);
          }else{
            continue;
          }

          //Track Inventory
          if(data[i].status == "terminated"){
            if(inventory[data[i].type] != undefined){
              if(inventory[data[i].type][data[i].id] != undefined){
                delete inventory[data[i].type][data[i].id];
              }
            }
          }else{
            if(inventory[data[i].type] == undefined){
              inventory[data[i].type] = {}; //New object type
            }

            if(inventory[data[i].type][data[i].id] == undefined){
              inventory[data[i].type][data[i].id] = {}; //New object
              inventory[data[i].type][data[i].id] = data[i];
              globeObjects.push(data[i]);
            }

            //Update
            objectUpdated = false;
            for(var x=0; x<inventoryFields.length; x++){                     
              //Field by field comparison
              if(data[i][inventoryFields[x]] instanceof Array){
                if(data[i][inventoryFields[x]] != undefined && 
                    JSON.stringify(data[i][inventoryFields[x]]) != JSON.stringify(inventory[data[i].type][data[i].id][inventoryFields[x]])){
                  
                  inventory[data[i].type][data[i].id][inventoryFields[x]] = data[i][inventoryFields[x]];
                  objectUpdated = true;
                }
              }else if(data[i][inventoryFields[x]] != undefined && 
                    data[i][inventoryFields[x]] != inventory[data[i].type][data[i].id][inventoryFields[x]]){
                
                inventory[data[i].type][data[i].id][inventoryFields[x]] = data[i][inventoryFields[x]];
                
                //Update texture color
                inventory[data[i].type][data[i].id].mesh.material.map = determineTextureFromData(data[i]);

                objectUpdated = true;
              }
            }
          }
        }
      }
      if(globeObjects.length > 0){
        for(var region in clouds.aws.regions){
          populateRegion(region);
          if(!firstInventorySetLoaded){
              getInitialTimeLineData();
              firstInventorySetLoaded = true;
          }
        }
      }
      document.body.style.backgroundImage = 'none'; // remove loading
    }
  }

  init();
  animate();
  window.addEventListener( 'mousemove', onMouseMove, false );
  window.requestAnimationFrame(render);
  this.load = load;
  this.elementShadowIntensity = elementShadowIntensity;
  this.scene = scene;
  this.setCameraPosition = setCameraPosition;
  this.clouds = clouds;
  this.globeRadius = globeRadius;
  this.regionOffset = regionOffset;
  this.updateHeatMap = updateHeatMap;
  this.globeMesh = globeMesh;
  this.runLoginAnimation = runLoginAnimation;
  this.timeWarpSpinMove = timeWarpSpinMove;
  this.enhance = enhance;
  this.zoomReset = zoomReset;
  return this;
};

