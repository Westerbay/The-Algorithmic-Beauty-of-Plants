class CanvasGL {

	constructor() {
		this.canvas = document.getElementById("glcanvas");
		this.zoomButton = document.getElementById("zoom");
		this.dezoomButton = document.getElementById("dezoom");
		this.resetCameraButton = document.getElementById("resetCamera");
		this.rotateButton = document.getElementById("rotate");
		this.gl = this.canvas.getContext("webgl");

		if (!this.gl) {
			alert("WebGL is not supported");
			return;
		}
		
		this.dragging = false;
		this.openGL = new OpenGL(this.gl);
		this.camera = this.openGL.camera;
		this.sensibility = 0.005;
		this.initInteraction();
		this.initOptions();
	}

	initOptions() {
		this.canvas.addEventListener("wheel", (e) => {
			e.preventDefault();

			if (e.deltaY > 0) {
				this.camera.increaseRadius(); 
			} else {
				this.camera.decreaseRadius(); 
			}
		});

		this.dezoomButton.addEventListener("click", () => {
			if (this.dragging) {
				return;
			}
			this.camera.increaseRadius();
		});

		this.zoomButton.addEventListener("click", () => {
			if (this.dragging) {
				return;
			}
			this.camera.decreaseRadius();
		});

		this.resetCameraButton.addEventListener("click", () => {
			if (this.dragging) {
				return;
			}
			this.camera.reset();
		});

		this.rotateButton.addEventListener("click", () => {
			if (this.dragging) {
				return;
			}
			this.camera.rotate = !this.camera.rotate;
			this.rotateButton.classList.toggle("active");
		});
	}
	
	initInteraction() {
		let lastX = 0;
		let lastY = 0;

		this.canvas.addEventListener("mousedown", (e) => {
			this.dragging = true;
			lastX = e.clientX;
			lastY = e.clientY;
		});

		window.addEventListener("mouseup", () => {
			this.dragging = false;
		});

		window.addEventListener("mousemove", (e) => {
			if (!this.dragging) {
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

