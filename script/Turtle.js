class Turtle {

	constructor(turtleState, angleRotationDegree) {
		this.turtleState = turtleState;
		this.angleRotation = this._degToRad(angleRotationDegree);
		this.mesh = new Mesh();
		this.states = [];
	}
	
	moveForward() {
		const start = vec3.clone(this.turtleState.position);
		this.moveForwardWithoutDrawing();
		const end = vec3.clone(this.turtleState.position);
		this.mesh.addLine(start, end, this.turtleState.colorIndex);
	}
	
	moveForwardWithoutDrawing() {
		const direction = vec3.fromValues(this.turtleState.orientation[0], this.turtleState.orientation[1], this.turtleState.orientation[2]);
		const delta = vec3.create();
		
		vec3.scale(delta, direction, this.turtleState.length);
		vec3.add(this.turtleState.position, this.turtleState.position, delta);
	}
	
	turn(angleRotation) {
		const cosAlpha = Math.cos(angleRotation);
		const sinAlpha = Math.sin(angleRotation);
		const R = mat3.fromValues(
			cosAlpha, sinAlpha, 0,
			-sinAlpha, cosAlpha, 0,
			0, 0, 1
		);
		mat3.multiply(this.turtleState.orientation, this.turtleState.orientation, R);
	}
	
	turnLeft() {
		this.turn(this.angleRotation);
	}

	turnRight() {
		this.turn(-this.angleRotation);
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
	
	_degToRad(deg) {
		return deg * Math.PI / 180;
	}
	
}

