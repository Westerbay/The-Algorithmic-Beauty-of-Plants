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
			uniform vec3 colorStack[1000];
			uniform int colorStackLength;
			
			varying vec3 fragColor;
			
			void main() {
				int i = int(aColorIndex);
				fragColor = colorStack[i];
				gl_Position = cameraMatrix * vec4(aPosition, 1.0);
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
		const vertices = mesh.getVertexBuffer();
		const colorIndices = mesh.getColorIndexBuffer();
		
		this.position = vec3.fromValues(mesh.centerX(), mesh.centerY(), 5);	
		
		this.vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		gl.enableVertexAttribArray(this.aPositionLoc);
		gl.vertexAttribPointer(this.aPositionLoc, 3, gl.FLOAT, false, 0, 0);	
		
		this.colorIndexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.colorIndexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, colorIndices, gl.STATIC_DRAW);
		gl.enableVertexAttribArray(this.aColorIndexLoc);
		gl.vertexAttribPointer(this.aColorIndexLoc, 1, gl.FLOAT, false, 0, 0);	
		
		this.vertexCount = vertices.length / 3;
	}
	
	startRenderLoop() {
		const loop = () => {
			this.render();
			requestAnimationFrame(loop);
		}
		requestAnimationFrame(loop);
	}
	
	render() {
		this.resizeCanvasToDisplaySize();
		const gl = this.gl;		
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.clearColor(1, 1, 1, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		
		const cameraMatrix = this.computeCameraMatrix(
			gl.canvas.width,
			gl.canvas.height
		); 
		gl.uniformMatrix4fv(this.cameraMatrixLocation, false, cameraMatrix);
		gl.uniform3fv(this.colorStackLocation, this.colors);
		gl.uniform1i(this.colorStackLengthLocation, this.colors.length);
		
		gl.drawArrays(gl.LINES, 0, this.vertexCount);
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

}

