class Mesh {

	constructor() {
		this.vertices = [];
		this.minX = Infinity;
		this.maxX = -Infinity;
		this.minY = Infinity;
		this.maxY = -Infinity;
	}
	
	addLine(start, end) {
		this.minX = Math.min(this.minX, start[0], end[0]);
		this.maxX = Math.max(this.maxX, start[0], end[0]);
		
		this.minY = Math.min(this.minY, start[1], end[1]);
		this.maxY = Math.max(this.maxY, start[1], end[1]);
		
		this.vertices.push(...start);
		this.vertices.push(...end);
	}
	
	getVertexBuffer() {
		return new Float32Array(this.vertices);
	}
	
	centerX() {
		return (this.minX + this.maxX) / 2;
	}
	
	centerY() {
		return (this.minY + this.maxY) / 2;
	}

}

