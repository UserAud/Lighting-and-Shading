window.OffscreenCanvas = function() { throw new Error(''); }

var BtnB1;
var canvas;
var gl;

var numVertices = 20;

var modelView, projection;
var program;

var modelViewMatrixLoc = mat4();
var projectionMatrixLoc = mat4();
var modelViewMatrix = mat4();
var projectionMatrix = mat4();

//Set default rotating around x, y and z axis
var axis = 0;
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

//Set default value for theta
var theta = [0, 0, 0];

//If flag is true, it will rotate while if false, it will pause the rotation
var flag = false;

//Light ambient * Material ambient
var ambientProduct;

//Light diffuse * Material diffuse
var diffuseProduct;

//Light specular * Material specular
var specularProduct;

let lightOn = true;

//Initialize lighting and shading
var lightPosition = vec4(0.1, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.1, 1.0, 0.4, 1.0);
var lightAmbientbp = vec4(0.1, 1.0, 0.4, 1.0);

var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightDiffusebp = vec4(1.0, 1.0, 1.0, 1.0);

var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecularbp = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
var materialShininess = 10.0;

//Store textures into variables
var sphereTexture, cylinderTexture, cubeTexture;    //Texture variable
var sphereTextures, cylinderTextures, cubeTextures; //Array of texture variable
var sphereBuffers, cylinderBuffers, cubeBuffers;    //Array of buffers

//Create the buffers for each shape that parsed in
function createBuffersForShape(data) {

  //Store shape data buffers in normal array
  const normals = data.TriangleNormals;

  //Store shape data buffers in vertices array
  const points = data.TriangleVertices;

  //Store shape data buffers in vertex color array
  const vertexcols = data.TriangleVertexColors;

  //Store shape data buffers in texture coordinates array
  const textcords = data.TextureCoordinates;

  //Setting all buffers

  //Normal buffer
  var nBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

  //Vertex color buffer
  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexcols), gl.STATIC_DRAW);

  //Point or vertices buffer
  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  //Texture coordinates buffer
  var tBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(textcords), gl.STATIC_DRAW);

  return {
    nBuffer,
    cBuffer,
    vBuffer,
    tBuffer,
    numVertices: points.length
  };
}

//Set attributes for each buffers of shape
function setAttributesForShape({
  nBuffer,
  cBuffer,
  vBuffer,
  tBuffer
}) {

  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);

  //Attribute location -- vNormal
  var vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  //Attribute location -- vColor
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  var vColor = gl.getAttribLocation(program, "vColor");
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  //Attribute location -- vPosition
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  //Attribute location -- vTexCoord
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
  gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vTexCoord);
}

function doWhichKey(e) {

  //Detect the key that user press on keyboard
  e = e || window.event;
  let charCode = e.keyCode || e.which;
  return String.fromCharCode(charCode);
}

//When a key is being press by user
window.addEventListener('keypress', function(e) {
  var key = doWhichKey(e);
  console.log("You pressed : " + key);
  if (key == "s" || key == "S") { //For stop or start animation
    flag = !flag;
  } else if (key == "x" || key == "X") { //Rotate x-axis
    axis = xAxis;
  } else if (key == "y" || key == "Y") { //Rotate y-axis
    axis = yAxis;
  } else if (key == "z" || key == "Z") { //Rotate z-axis
    axis = zAxis;
  } else {
    //If user pressed other key, nothing happened
  }
}, false);

//Called this function when page loads, this will initialize all configuration
function init() {

  //Get the html canvas element by id and stored it into canvas
  canvas = document.getElementById("gl-canvas");

  //Set webgl
  gl = WebGLUtils.setupWebGL(canvas);

  //Detect and display message if no webgl
  if (!gl) alert("WebGL isn't available");

  //Set up viewport using the resolution of canvas
  gl.viewport(0, 0, canvas.width, canvas.height);

  //Enable the depth testing
  gl.enable(gl.DEPTH_TEST);

  //Create 3D shape : Sphere
  var mySphere = sphere(5);
  mySphere.scale(0.25, 0.25, 0.25); //Smaller the size of sphere
  mySphere.translate(0.0, 0.0, 0.0); //Move sphere to the lef

  //Create 3D object : Cylinder
  var myCylinder = cylinder(72, 3, true);
  myCylinder.scale(0.30, 0.30, 0.30); //Smaller the size of cylinder
  myCylinder.rotate(45.0, [1, 1, 1]); //Rotate cylinder a bit
  myCylinder.translate(0.6, 0.0, 0.0); //No movement for cylinder

  //Create 3D object : Cube
  var myCube = cube(0.3);
  myCube.rotate(45.0, [1, 1, 1]); //Rotate cube a bit
  myCube.translate(-0.6, 0.0, 0.0); //Move cube to the right

  //Each of the object, store their buffers separately
  sphereBuffers = createBuffersForShape(mySphere); //Create buffer for sphere
  cylinderBuffers = createBuffersForShape(myCylinder); //Create buffer for cylinder
  cubeBuffers = createBuffersForShape(myCube); //Create buffer for cube

  //Configure texture
  function createTexture(id) {

    const image = document.getElementById(id);
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return texture;
  }

  //Load shaders and initialize attribute buffers
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  //Calculate matrix of lighting
  ambientProduct = mult(lightAmbient, materialAmbient);
  diffuseProduct = mult(lightDiffuse, materialDiffuse);
  specularProduct = mult(lightSpecular, materialSpecular);

  //Prepare model view
  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
  projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

  //Call texture function to map these textures
  sphereTextures = [
    createTexture("PictureA1"),
    createTexture("PictureA2"),
    createTexture("PictureA3"),
  ];
  cylinderTextures = [
    createTexture("PictureB1"),
    createTexture("PictureB2"),
    createTexture("PictureB3"),
  ];
  cubeTextures = [
    createTexture("PictureC1"),
    createTexture("PictureC2"),
    createTexture("PictureC3"),
  ];

  //Initialie texture of each object
  sphereTexture = sphereTextures[0];
  cubeTexture = cubeTextures[0];
  cylinderTexture = cylinderTextures[0];

  //Set the projection of orthographic (representing 3D objects in 2D screen)
  projection = ortho(-1, 1, -1, 1, -100, 100);

  //Toggle material shininess
  document.getElementById("materialshininess").onchange = function() {
    materialShininess = document.getElementById("materialshininess").value;
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
  };

  //Toggle the light position
  document.getElementById("lightpositions").onchange = function() {
    var x = document.getElementById("lightpositions").value;
    lightPosition = vec4(x, 1.0, 1.0, 0.0);
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
  };

  //Toggle the ambient light
  document.getElementById("ambientLight").onchange = function() {
    var x = document.getElementById("ambientLight").value;
    lightAmbient = vec4(x, x, 0.1, 1.0);
    lightAmbientbp = vec4(x, x, 0.1, 1.0);
    ambientProduct = mult(lightAmbient, materialAmbient);
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
  };

  //Toggle the diffuse light
  document.getElementById("diffuseLight").onchange = function() {
    var x = document.getElementById("diffuseLight").value;
    lightDiffuse = vec4(x, x, 0.1, 1.0);
    lightDiffusebp = vec4(x, x, 0.1, 1.0);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
  };

  //Toggle the specular light
  document.getElementById("specularLight").onchange = function() {
    var x = document.getElementById("specularLight").value;
    lightSpecular = vec4(x, x, 0.1, 1.0);
    lightSpecularbp = vec4(x, x, 0.1, 1.0);
    specularProduct = mult(lightSpecular, materialSpecular);
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
  };

  //Object A - Sphere
  document.getElementById("BtnA1").onclick = function() {
    sphereTexture = sphereTextures[0];
  };
  document.getElementById("BtnA2").onclick = function() {
    sphereTexture = sphereTextures[1];
  };
  document.getElementById("BtnA3").onclick = function() {
    sphereTexture = sphereTextures[2];
  };

  //Object B - Cylinder
  document.getElementById("BtnB1").onclick = function() {
    cylinderTexture = cylinderTextures[0];
  };
  document.getElementById("BtnB2").onclick = function() {
    cylinderTexture = cylinderTextures[1];
  };
  document.getElementById("BtnB3").onclick = function() {
    cylinderTexture = cylinderTextures[2];
  };

  //Object C - Cube
  document.getElementById("BtnC1").onclick = function() {
    cubeTexture = cubeTextures[0];
  };
  document.getElementById("BtnC2").onclick = function() {
    cubeTexture = cubeTextures[1];
  };
  document.getElementById("BtnC3").onclick = function() {
    cubeTexture = cubeTextures[2];
  };

  //Click axis button
  document.getElementById("buttonX").onclick = function() {
    axis = xAxis; //Rotate in x-axis
  };
  document.getElementById("buttonY").onclick = function() {
    axis = yAxis; //Rotate in y-axis
  };
  document.getElementById("buttonZ").onclick = function() {
    axis = zAxis; //Rotate in z-axis
  };

  //Click animation start/pause
  document.getElementById("StopStart").onclick = function() {
    flag = !flag; //Stop or start animation
  };

  //Click animation light ON/OFF
  document.getElementById("btn_toggle_light").onclick = function() {
    
    if (lightOn) {
      lightOn = false;
      updateBlackColors();
      
      document.querySelector('#btn_toggle_light').innerHTML = 'Turn Light ON';
  
    } else {
      lightOn = true;

      updateLightColors();
      document.querySelector('#btn_toggle_light').innerHTML = 'Turn Light OFF';
      //On or off light
    } 
  };
  const updateBlackColors = () => {
    lightAmbient = vec4(0, 0, 0.1, 1.0);
    ambientProduct = mult(lightAmbient, materialAmbient);
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));

    lightDiffuse = vec4(0,0, 0.1, 1.0);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));

    lightSpecular = vec4(0, 0, 0.1, 1.0);
    specularProduct = mult(lightSpecular, materialSpecular);
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
  }

  const updateLightColors = () => {
    /**
     * Update scene light colors based on user input
     * 
     * @function updateLightColors
     */
    ambientProduct = mult(lightAmbientbp, materialAmbient);
      gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));

      diffuseProduct = mult(lightDiffusebp, materialDiffuse);
      gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));

      specularProduct = mult(lightSpecularbp, materialSpecular);
      gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
  }

  //Lighting and shading
  gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
  gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

  //Render the canvas per frame
  render();
}

//Draw shape, parse the shape buffers and texture accordingly
function drawShape(shapeBuffers, texture) {
  setAttributesForShape(shapeBuffers);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.drawArrays(gl.TRIANGLES, 0, shapeBuffers.numVertices);
}

//Render canvas
var render = function() {

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projection));

  //If flag==true, it will rotate, hence add the rotation by 2 degree per frame
  if (flag) theta[axis] += 2.0;

  modelView = mat4();
  modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0]));
  modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0]));
  modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1]));

  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelView));

  //Draw each shape individually by based on buffers and texture
  drawShape(cylinderBuffers, cylinderTexture);
  drawShape(cubeBuffers, cubeTexture);
  drawShape(sphereBuffers, sphereTexture);

  //Request render canvas per frame
  requestAnimFrame(render);
}

init();
