class Turtle {

	constructor(turtleState) {
		this.turtleState = turtleState;
		this.mesh = new Mesh();
		this.states = [];
	}
	
	moveForward() {
		const start = vec3.clone(this.turtleState.position);
		this.moveForwardWithoutDrawing();
		const end = vec3.clone(this.turtleState.position);
		this.mesh.addLine(start, end);
	}
	
	moveForwardWithoutDrawing() {
		const direction = vec3.fromValues(this.turtleState.orientation[0], this.turtleState.orientation[1], this.turtleState.orientation[2]);
		const delta = vec3.create();
		
		vec3.scale(delta, direction, this.turtleState.length);
		vec3.add(this.turtleState.position, this.turtleState.position, delta);
	}
	
	turnLeft() {
		const cosAlpha = Math.cos(this.turtleState.angleRotation);
		const sinAlpha = Math.sin(this.turtleState.angleRotation)
		const R = mat3.fromValues(
			cosAlpha, sinAlpha, 0,
			-sinAlpha, cosAlpha, 0,
			0, 0, 1
		);
		mat3.multiply(this.turtleState.orientation, this.turtleState.orientation, R);
	}

	turnRight() {
		const cosAlpha = Math.cos(-this.turtleState.angleRotation);
		const sinAlpha = Math.sin(-this.turtleState.angleRotation)
		const R = mat3.fromValues(
			cosAlpha, sinAlpha, 0,
			-sinAlpha, cosAlpha, 0,
			0, 0, 1
		);
		mat3.multiply(this.turtleState.orientation, this.turtleState.orientation, R);
	}

	pitchUp() {
	}

	pitchDown() {
	}

	rollLeft() {
	}

	rollRight() {
	}

	turnAround() {
	}

	rotateVertical() {
	}
	
	startBranch() {
		this.states.push(this.turtleState.clone());
	}
	
	completeBranch() {
		this.turtleState = this.states.pop();
	}
	
	startPolygon() {
	}
	
	moveForwardWithoutRecord() {
	}
	
	recordVertex() {
	}
	
	completePolygon() {
	}
	
	incorporateSurface() {
	}
	
	decrementDiameter() {
	}
	
	incrementColor() {
	}
	
	cutOffRemainderBranch() {
	}
	
}

