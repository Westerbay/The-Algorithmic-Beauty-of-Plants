const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl");

if (!gl) {
  alert("WebGL non supporté");
}

// === Shaders ===
const vsSource = `
  attribute vec3 aPosition;
  uniform mat4 uMVP;
  void main() {
    gl_Position = uMVP * vec4(aPosition, 1.0);
  }
`;

const fsSource = `
  precision mediump float;
  void main() {
    gl_FragColor = vec4(0.2, 0.7, 1.0, 1.0);
  }
`;

// === Compile Shaders ===
function compileShader(src, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error("Shader error: " + gl.getShaderInfoLog(shader));
  }
  return shader;
}

const vs = compileShader(vsSource, gl.VERTEX_SHADER);
const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);
gl.useProgram(program);

// === Cube Vertices ===
const cubeVertices = new Float32Array([
  // Front face
  -1, -1,  1,   1, -1,  1,   1,  1,  1,
  -1, -1,  1,   1,  1,  1,  -1,  1,  1,
  // Back face
  -1, -1, -1,  -1,  1, -1,   1,  1, -1,
  -1, -1, -1,   1,  1, -1,   1, -1, -1,
  // Top face
  -1,  1, -1,  -1,  1,  1,   1,  1,  1,
  -1,  1, -1,   1,  1,  1,   1,  1, -1,
  // Bottom face
  -1, -1, -1,   1, -1, -1,   1, -1,  1,
  -1, -1, -1,   1, -1,  1,  -1, -1,  1,
  // Right face
   1, -1, -1,   1,  1, -1,   1,  1,  1,
   1, -1, -1,   1,  1,  1,   1, -1,  1,
  // Left face
  -1, -1, -1,  -1, -1,  1,  -1,  1,  1,
  -1, -1, -1,  -1,  1,  1,  -1,  1, -1,
]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

const aPos = gl.getAttribLocation(program, "aPosition");
gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aPos);

// === Matrices ===
const uMVPLoc = gl.getUniformLocation(program, "uMVP");

const model = mat4.create();
const view = mat4.create();
const proj = mat4.create();
const mvp = mat4.create();

mat4.lookAt(view, [3, 3, 3], [0, 0, 0], [0, 1, 0]);
mat4.perspective(proj, Math.PI / 4, canvas.width / canvas.height, 0.1, 100);

// === Render Loop ===
function render(time) {
  time *= 0.001; // ms -> s

  mat4.identity(model);
  mat4.rotateY(model, model, time);
  mat4.rotateX(model, model, time * 0.5);

  mat4.multiply(mvp, proj, view);
  mat4.multiply(mvp, mvp, model);

  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  gl.uniformMatrix4fv(uMVPLoc, false, mvp);
  gl.drawArrays(gl.TRIANGLES, 0, cubeVertices.length / 3);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);

