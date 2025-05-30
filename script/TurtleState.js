class TurtleState {

	constructor(length, position, colorIndex) {		
		this.length = length;
		this.position = vec3.clone(position);
		this.orientation = mat3.fromValues(
			0, 1, 0,
			-1,  0, 0,
			0,  0, -1
		);
		this.colorIndex = colorIndex;
		this.lastVertexElementLine = 0;
	}
	
	clone() {
		const copy = new TurtleState(this.length, this.position, this.colorIndex);
		mat3.copy(copy.orientation, this.orientation);
		copy.lastVertexElementLine = this.lastVertexElementLine; 
		return copy;
	}

}

