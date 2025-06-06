class Turtle {

	constructor(turtleState, angleRotationDegree) {
		this.turtleState = turtleState;
		this.angleRotation = this._degToRad(angleRotationDegree);
		this.mesh = new Mesh();
		this.mesh.addVertexLine(
			vec3.clone(this.turtleState.position),
			turtleState.colorIndex
		);
		
		this.currentVertexElementLine = 0;
		this.currentVertexElementPolygon = 0;
		this.recordPolygon = false;
		this.states = [];		
		this.polygonElements = [];
	}
	
	moveForward() {
		this.moveForwardWithoutDrawing();
		this.mesh.addLine(this.turtleState.lastVertexElementLine, this.currentVertexElementLine);
		this.turtleState.lastVertexElementLine = this.currentVertexElementLine;
	}
	
	moveForwardWithoutDrawing() {
		const direction = vec3.fromValues(this.turtleState.orientation[0], this.turtleState.orientation[1], this.turtleState.orientation[2]);
		const delta = vec3.create();
		
		vec3.scale(delta, direction, this.turtleState.length);
		vec3.add(this.turtleState.position, this.turtleState.position, delta);
		
		if (this.recordPolygon) {
			this.mesh.addVertexPolygon(
				vec3.clone(this.turtleState.position),
				this.turtleState.colorIndex
			);
			
			this.polygonElements.push(this.currentVertexElementPolygon);
			this.currentVertexElementPolygon += 1;
		}
		else {
			this.mesh.addVertexLine(
				vec3.clone(this.turtleState.position),
				this.turtleState.colorIndex
			);
			this.currentVertexElementLine += 1;
		}		
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
		this.recordPolygon = true;
	}
	
	moveForwardWithoutRecord() {
	}
	
	recordVertex() {
	}
	
	completePolygon() {
		this.mesh.addPolygon(this.polygonElements);
		this.recordPolygon = false;
		this.polygonElements = [];
	}
	
	incorporateSurface() {
	}
	
	decrementDiameter() {
		this.turtleState.length *= 0.5;
	}
	
	incrementColor() {
		this.turtleState.colorIndex += 1;
	}
	
	cutOffRemainderBranch() {
		this.states = [];
	}
	
	_degToRad(deg) {
		return deg * Math.PI / 180;
	}
	
}

