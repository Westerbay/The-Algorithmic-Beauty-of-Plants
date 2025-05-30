class CanvasGL {

	constructor() {
		const canvas = document.getElementById("glcanvas");
		this.gl = canvas.getContext("webgl");

		if (!this.gl) {
			alert("WebGL is not supported");
			return;
		}
		
		this.openGL = new OpenGL(this.gl);
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
	
	startRenderLoop() {
		const loop = (time) => {
			this.resizeCanvasToDisplaySize();
			this.openGL.render(time);
			requestAnimationFrame(loop);
		}
		requestAnimationFrame(loop);
	}

}

