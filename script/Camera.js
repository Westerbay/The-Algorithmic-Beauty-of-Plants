class Camera {

	constructor() {
		this.position = vec3.create();
	}
	
	rotateModel(time) {
		const model = mat4.create();
		mat4.rotate(model, model, time * 0.001, [0, 1, 0]);
		return model;
	}
	
	computeMatrix(width, height) {
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

