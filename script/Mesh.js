class Mesh {

	constructor() {
		this.verticesLine = [];
		this.colorIndicesLine = [];
		this.verticesPolygon = [];
		this.colorIndicesPolygon = [];
		this.minX = Infinity;
		this.maxX = -Infinity;
		this.minY = Infinity;
		this.maxY = -Infinity;
	}
	
	addLine(start, end, colorIndex) {
		this.minX = Math.min(this.minX, start[0], end[0]);
		this.maxX = Math.max(this.maxX, start[0], end[0]);
		
		this.minY = Math.min(this.minY, start[1], end[1]);
		this.maxY = Math.max(this.maxY, start[1], end[1]);
		
		this.verticesLine.push(...start);
		this.verticesLine.push(...end);
		
		this.colorIndicesLine.push(colorIndex);
		this.colorIndicesLine.push(colorIndex);	
	}
	
	addPolygon(vertices, colorIndices) {
		for (let i = 1; i < vertices.length - 1; i ++) {
			this.verticesPolygon.push(...vertices[i]);
			this.colorIndicesPolygon.push(colorIndices[i]);
			
			this.verticesPolygon.push(...vertices[i + 1]);
			this.colorIndicesPolygon.push(colorIndices[i + 1]);
			
			this.verticesPolygon.push(...vertices[0]);
			this.colorIndicesPolygon.push(colorIndices[0]);
		}
	}
	
	getVertexLineBuffer() {
		return new Float32Array(this.verticesLine);
	}
	
	getColorIndexLineBuffer() {
		return new Float32Array(this.colorIndicesLine);
	}
	
	getVertexPolygonBuffer() {
		return new Float32Array(this.verticesPolygon);
	}
	
	getColorIndexPolygonBuffer() {
		return new Float32Array(this.colorIndicesPolygon);
	}
	
	centerX() {
		return (this.minX + this.maxX) / 2;
	}
	
	centerY() {
		return (this.minY + this.maxY) / 2;
	}

}

