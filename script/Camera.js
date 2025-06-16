class Camera {

	constructor() {
		this.offsetDepth = 5;
		this.maxZoomDistance = 0.1;
		this.rotateSpeed = 0.015;
		this.FOV = 60;
		this.nearPlane = 0.1;
		this.farPlane = 1000;
		this.radius = 0;
		this.yaw = 0;
		this.pitch = 0;
		this.maxDepth = 0;
		this.minHeight = 0;
		this.center = vec3.fromValues(0, 0, 0);
		this.position = vec3.fromValues(0, 0, 0);
		this.rotate = false;
	}

	reset() {
		this.yaw = 0;
		this.pitch = 0;
	}

	increaseRadius() {
		this.radius += 1;
	}

	decreaseRadius() {
		this.radius = Math.max(this.maxDepth + this.maxZoomDistance, this.radius - 1);
	}

	setCenter(x, y, z) {
		vec3.set(this.center, x, y, z);
	}

	setMaxDepth(depth) {
		this.radius = depth + this.offsetDepth;
		this.maxDepth = depth;
	}

	setMinHeight(height) {
		this.minHeight = height;
	}

	computePosition() {
		var x = this.radius * Math.cos(this.pitch) * Math.sin(this.yaw);
		var y = this.radius * Math.sin(this.pitch);
		var z = this.radius * Math.cos(this.pitch) * Math.cos(this.yaw);
		if (y + this.center[1] - 0.1 < this.minHeight) {
			y = this.minHeight - this.center[1] + 0.1;
		}
		return vec3.fromValues(x + this.center[0], y + this.center[1], z + this.center[2]);
	}

	update() {
		if (this.rotate) {
			this.yaw += this.rotateSpeed;
			if (this.yaw > 2 * Math.PI) {
				this.yaw -= 2 * Math.PI;
			}
		}
		this.position = this.computePosition();
	}

	computeMatrices(width, height) {
		this.update();
		const aspect = width / height;
		const projection = mat4.create();
		mat4.perspective(projection, this.FOV * Math.PI / 180, aspect, this.nearPlane, this.farPlane);

		const viewWorld = mat4.create();
		mat4.lookAt(viewWorld, this.position, this.center, [0, 1, 0]);

		const world = mat4.create();
		mat4.multiply(world, projection, viewWorld);

		const viewBackground = mat4.create();
		mat4.copy(viewBackground, viewWorld);
		viewBackground[15] = 1;
		viewBackground[14] = 0; 
		viewBackground[13] = 0;
		viewBackground[12] = 0;
		viewBackground[11] = 0;
		viewBackground[3] = 0;
		viewBackground[7] = 0;

		const background = mat4.create();
		mat4.multiply(background, projection, viewBackground);

		return [background, world];
	}

}
