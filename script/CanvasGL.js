class CanvasGL {

	constructor(mesh) {
		const canvas = document.getElementById("glcanvas");
		this.gl = canvas.getContext("webgl");

		if (!this.gl) {
			alert("WebGL non supporté");
			return;
		}
		
		this.mesh = mesh;
		this.initShader();
		this.createBuffers();	
		this.render();
	}
	
	initShader() {
		const vsSource = `
		  attribute vec3 aPosition;
		  void main() {
			gl_Position = vec4(aPosition, 1.0);
		  }
		`;

		const fsSource = `
		  void main() {
			gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
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
	
	createBuffers() {
		const gl = this.gl;
		const vertices = this.mesh.getVertexBuffer();

		this.vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		this.vertexCount = vertices.length / 3;
	}
	
	render() {
		const gl = this.gl;
		
		console.log(gl.canvas.width);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.clearColor(1, 1, 1, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.useProgram(this.program);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.enableVertexAttribArray(this.aPositionLoc);
		gl.vertexAttribPointer(this.aPositionLoc, 3, gl.FLOAT, false, 0, 0);

		gl.drawArrays(gl.LINES, 0, this.vertexCount);
	}

}

