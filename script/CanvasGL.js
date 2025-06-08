class CanvasGL {

	constructor() {
		this.canvas = document.getElementById("glcanvas");
		this.gl = this.canvas.getContext("webgl");

		if (!this.gl) {
			alert("WebGL is not supported");
			return;
		}
		
		this.openGL = new OpenGL(this.gl);
		this.camera = this.openGL.camera;
		this.sensibility = 0.005;
		this.initInteraction();
	}
	
	initInteraction() {
		let dragging = false;
		let lastX = 0;
		let lastY = 0;

		this.canvas.addEventListener("mousedown", (e) => {
			dragging = true;
			lastX = e.clientX;
			lastY = e.clientY;
		});

		window.addEventListener("mouseup", () => {
			dragging = false;
		});

		window.addEventListener("mousemove", (e) => {
			if (!dragging) {
				return;
			}

			const dx = e.clientX - lastX;
			const dy = e.clientY - lastY;
			lastX = e.clientX;
			lastY = e.clientY;

			this.camera.yaw -= dx * this.sensibility;
			this.camera.pitch += dy * this.sensibility;

			const limit = Math.PI / 2 - 0.01;
			this.camera.pitch = Math.max(-limit, Math.min(limit, this.camera.pitch));
		});
	}

	
	resizeCanvasToDisplaySize() {
		const canvas = this.gl.canvas;
		const displayWidth = canvas.clientWidth;
		const displayHeight = canvas.clientHeight;

		if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
			canvas.width = displayWidth;
			canvas.height = displayHeight;
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

