class TurtleState {

	constructor(length, angleRotationDegree, position) {
		this.length = length;
		this.angleRotationDegree = angleRotationDegree;
		this.angleRotation = this.degToRad(angleRotationDegree);
		this.position = vec3.clone(position);
		this.orientation = mat3.fromValues(
			0, 1, 0,
			-1,  0, 0,
			0,  0, -1
		);
	}
	
	degToRad(deg) {
		return deg * Math.PI / 180;
	}
	
	clone() {
		const copy = new TurtleState(this.length, this.angleRotationDegree, this.position);
		mat3.copy(copy.orientation, this.orientation);
		return copy;
	}

}

