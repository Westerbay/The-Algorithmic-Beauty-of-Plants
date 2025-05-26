class Mesh {

	constructor() {
		this.vertices = [];
	}
	
	addLine(start, end) {
		this.vertices.push(...start);
		this.vertices.push(...end);
	}
	
	getVertexBuffer() {
		return new Float32Array(this.vertices);
	}

}

