class CanvasGL {

	constructor() {
		const canvas = document.getElementById("glcanvas");
		this.gl = canvas.getContext("webgl");

		if (!this.gl) {
			alert("WebGL is not supported");
			return;
		}
		
		this.colors = [];
		this.initShader();
	}
	
	initShader() {
		const vsSource = `
			attribute vec3 aPosition;
			attribute float aColorIndex;
			
			uniform mat4 cameraMatrix;
			uniform mat4 model;
			uniform vec3 colorStack[1000];
			uniform int colorStackLength;
			
			varying vec3 fragColor;
			
			void main() {
				int i = int(aColorIndex);
				fragColor = colorStack[i];
				gl_Position = cameraMatrix * model * vec4(aPosition, 1.0);
			}
		`;

		const fsSource = `
			precision mediump float;
			varying vec3 fragColor;			
			
			void main() {
				gl_FragColor = vec4(fragColor, 1.0);
			}
		`;
		
		const gl = this.gl;		
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
		this.position = vec3.fromValues(mesh.centerX(), mesh.centerY(), 5);	
		
		const verticesLine = mesh.getVertexLineBuffer();
		const colorIndicesLine = mesh.getColorIndexLineBuffer();
		const verticesPolygon = mesh.getVertexPolygonBuffer();
		const colorIndicesPolygon = mesh.getColorIndexPolygonBuffer();
		
		this.vertexLineBuffer = gl.createBuffer();
		this.configBuffer(this.vertexLineBuffer, verticesLine);
		this.vertexPolygonBuffer = gl.createBuffer();
		this.configBuffer(this.vertexPolygonBuffer, verticesPolygon);
		
		this.colorIndexLineBuffer = gl.createBuffer();
		this.configBuffer(this.colorIndexLineBuffer, colorIndicesLine);
		this.colorIndexPolygonBuffer = gl.createBuffer();
		this.configBuffer(this.colorIndexPolygonBuffer, colorIndicesPolygon);
		
		this.vertexLineCount = verticesLine.length / 3;
		this.vertexPolygonCount = verticesPolygon.length / 3;
	}
	
	configBuffer(buffer, data) {
		const gl = this.gl;	
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	}
	
	startRenderLoop() {
		const loop = (time) => {
			this.render(time);
			requestAnimationFrame(loop);
		}
		requestAnimationFrame(loop);
	}
	
	render(time) {
		this.resizeCanvasToDisplaySize();
		const gl = this.gl;		
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.clearColor(1, 1, 1, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		
		const cameraMatrix = this.computeCameraMatrix(
			gl.canvas.width,
			gl.canvas.height
		); 
		gl.uniformMatrix4fv(this.modelMatrixLocation, false, this.rotateModel(time));
		gl.uniformMatrix4fv(this.cameraMatrixLocation, false, cameraMatrix);
		gl.uniform3fv(this.colorStackLocation, this.colors);
		gl.uniform1i(this.colorStackLengthLocation, this.colors.length);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexLineBuffer);
		gl.enableVertexAttribArray(this.aPositionLoc);
		gl.vertexAttribPointer(this.aPositionLoc, 3, gl.FLOAT, false, 0, 0);	
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.colorIndexLineBuffer);
		gl.enableVertexAttribArray(this.aColorIndexLoc);
		gl.vertexAttribPointer(this.aColorIndexLoc, 1, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.LINES, 0, this.vertexLineCount);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPolygonBuffer);
		gl.enableVertexAttribArray(this.aPositionLoc);
		gl.vertexAttribPointer(this.aPositionLoc, 3, gl.FLOAT, false, 0, 0);	
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.colorIndexPolygonBuffer);
		gl.enableVertexAttribArray(this.aColorIndexLoc);
		gl.vertexAttribPointer(this.aColorIndexLoc, 1, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.TRIANGLES, 0, this.vertexPolygonCount);
	}
	
	resizeCanvasToDisplaySize() {
		const canvas = this.gl.canvas;
		const displayWidth = canvas.clientWidth;
		const displayHeight = canvas.clientHeight;

		if (canvas.width * 2 !== displayWidth || canvas.height * 2 !== displayHeight) {
			canvas.width = 2 * displayWidth;
			canvas.height = 2 * displayHeight;
		}
	}

	computeCameraMatrix(width, height) {
		const aspectRatio = width / height;
		const projection = mat4.create();
		mat4.perspective(
			projection,
			60 * Math.PI / 180,
			aspectRatio,
			0.1,
			1000,
		);
		
		const view = mat4.create();
		const target = vec3.create();
		vec3.add(target, this.position, vec3.fromValues(0, 0, -1));
		
		mat4.lookAt(
			view,
			this.position,
			target,
			vec3.fromValues(0, 1, 0)
		);
		
		const world = mat4.create();
		mat4.multiply(world, projection, view);
		
		return world;
	}
	
	rotateModel(time) {
		const model = mat4.create();
		mat4.rotate(model, model, time * 0.001, [0, 1, 0]);
		return model;
	}

}

