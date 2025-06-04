class OpenGL {

	constructor(glcontext) {
		this.gl = glcontext;
		this.camera = new Camera();
		this.colors = [];
		this.initShader();
		this.gl.getExtension('OES_element_index_uint');
	}
	
	getVertexShader() {
		return `
			attribute vec3 aPosition;
			attribute float aColorIndex;
			
			uniform mat4 cameraMatrix;
			uniform mat4 model;
			uniform vec3 colorStack[16];
			uniform int colorStackLength;
			
			varying vec3 fragColor;
			
			void main() {
				int i = int(aColorIndex);
				fragColor = colorStack[i];
				gl_Position = cameraMatrix * model * vec4(aPosition, 1.0);
			}
		`;
	}
	
	getFragmentShader() {
		return `
			precision mediump float;
			varying vec3 fragColor;			
			
			void main() {
				gl_FragColor = vec4(fragColor, 1.0);
			}
		`;
	}
	
	initShader() {
		const gl = this.gl;	
		const vsSource = this.getVertexShader();
		const fsSource = this.getFragmentShader();	
		const vs = this.compileShader(vsSource, gl.VERTEX_SHADER);
		const fs = this.compileShader(fsSource, gl.FRAGMENT_SHADER);
		
		this.program = gl.createProgram();
		gl.attachShader(this.program, vs);
		gl.attachShader(this.program, fs);
		gl.linkProgram(this.program);
		gl.useProgram(this.program);
		
		this.aPositionLoc = gl.getAttribLocation(this.program, "aPosition");
		this.aColorIndexLoc = gl.getAttribLocation(this.program, "aColorIndex");
		this.modelMatrixLocation = gl.getUniformLocation(this.program, "model");
		this.cameraMatrixLocation = gl.getUniformLocation(this.program, "cameraMatrix");
		this.colorStackLocation = gl.getUniformLocation(this.program, "colorStack");
		this.colorStackLengthLocation = gl.getUniformLocation(this.program, "colorStackLength");
	}
	
	compileShader(src, type) {
		const gl = this.gl;
		const shader = gl.createShader(type);
		gl.shaderSource(shader, src);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			throw new Error("Shader error: " + gl.getShaderInfoLog(shader));
		}
		return shader;
	}
	
	loadMesh(mesh) {	
		const gl = this.gl;		
		this.camera.position = vec3.fromValues(mesh.centerX(), mesh.centerY(), 5);	
		
		const verticesLine = mesh.getVertexLineBuffer();
		const colorIndicesLine = mesh.getColorIndexLineBuffer();
		const elementsLine = mesh.getElementLineBuffer();
		const verticesPolygon = mesh.getVertexPolygonBuffer();
		const colorIndicesPolygon = mesh.getColorIndexPolygonBuffer();
		const elementsPolygon = mesh.getElementPolygonBuffer();
		
		this.vertexLineBuffer = gl.createBuffer();
		this.configBuffer(gl.ARRAY_BUFFER, this.vertexLineBuffer, verticesLine);
		this.vertexPolygonBuffer = gl.createBuffer();
		this.configBuffer(gl.ARRAY_BUFFER, this.vertexPolygonBuffer, verticesPolygon);
		
		this.colorIndexLineBuffer = gl.createBuffer();
		this.configBuffer(gl.ARRAY_BUFFER, this.colorIndexLineBuffer, colorIndicesLine);
		this.colorIndexPolygonBuffer = gl.createBuffer();
		this.configBuffer(gl.ARRAY_BUFFER, this.colorIndexPolygonBuffer, colorIndicesPolygon);
		
		this.elementLineBuffer = gl.createBuffer();
		this.configBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementLineBuffer, elementsLine);
		
		this.elementPolygonBuffer = gl.createBuffer();
		this.configBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementPolygonBuffer, elementsPolygon);
		
		this.elementLineCount = elementsLine.length;
		this.elementPolygonCount = elementsPolygon.length;
	}
	
	configBuffer(type, buffer, data) {
		const gl = this.gl;	
		gl.bindBuffer(type, buffer);
		gl.bufferData(type, data, gl.STATIC_DRAW);
	}
	
	render(time) {		
		const gl = this.gl;		
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.clearColor(1, 1, 1, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		
		const cameraMatrix = this.camera.computeMatrix(
			gl.canvas.width,
			gl.canvas.height
		); 
		gl.uniformMatrix4fv(this.modelMatrixLocation, false, this.camera.rotateModel(time));
		gl.uniformMatrix4fv(this.cameraMatrixLocation, false, cameraMatrix);
		gl.uniform3fv(this.colorStackLocation, this.colors);
		gl.uniform1i(this.colorStackLengthLocation, this.colors.length);
		
		this.bindVBO(this.vertexLineBuffer, this.aPositionLoc, 3);
		this.bindVBO(this.colorIndexLineBuffer, this.aColorIndexLoc, 1);		
		this.drawMode(this.elementLineBuffer, gl.LINES, this.elementLineCount);
		
		this.bindVBO(this.vertexPolygonBuffer, this.aPositionLoc, 3);
		this.bindVBO(this.colorIndexPolygonBuffer, this.aColorIndexLoc, 1);	
		this.drawMode(this.elementPolygonBuffer, gl.TRIANGLES, this.elementPolygonCount);
	}
	
	bindVBO(buffer, location, numberElement) {
		const gl = this.gl;
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.enableVertexAttribArray(location);
		gl.vertexAttribPointer(location, numberElement, gl.FLOAT, false, 0, 0);
	}
	
	drawMode(ebo, mode, count) {
		const gl = this.gl;
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
		gl.drawElements(mode, count, gl.UNSIGNED_INT, 0);
	}

}

