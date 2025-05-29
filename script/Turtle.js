class Turtle {

	constructor(turtleState, angleRotationDegree) {
		this.turtleState = turtleState;
		this.angleRotation = this._degToRad(angleRotationDegree);
		this.mesh = new Mesh();
		this.states = [];
		this.polygonVertices = [];
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
	
	pitch(angleRotation) {
		const cosAlpha = Math.cos(angleRotation);
		const sinAlpha = Math.sin(angleRotation);
		const R = mat3.fromValues(
			cosAlpha, 0, -sinAlpha,
			0, 1, 0,
			sinAlpha, 0, cosAlpha
		);
		mat3.multiply(this.turtleState.orientation, this.turtleState.orientation, R);
	}

	pitchUp() {
		this.pitch(this.angleRotation);
	}

	pitchDown() {
		this.pitch(-this.angleRotation);
	}
	
	roll(angleRotation) {
		const cosAlpha = Math.cos(angleRotation);
		const sinAlpha = Math.sin(angleRotation);
		const R = mat3.fromValues(
			1, 0, 0,
			0, cosAlpha, -sinAlpha,
			0, sinAlpha, cosAlpha
		);
		mat3.multiply(this.turtleState.orientation, this.turtleState.orientation, R);
	}

	rollLeft() {
		this.roll(this.angleRotation);
	}

	rollRight() {
		this.roll(-this.angleRotation);
	}

	turnAround() {
		this.turn(Math.PI);
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
		this.polygonVertices = [];
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
		this.turtleState.length --;
	}
	
	incrementColor() {
		this.turtleState.colorIndex ++;
	}
	
	cutOffRemainderBranch() {
		this.states = [];
	}
	
	_degToRad(deg) {
		return deg * Math.PI / 180;
	}
	
}

