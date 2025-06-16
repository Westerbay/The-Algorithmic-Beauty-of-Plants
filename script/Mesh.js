class Mesh {

	constructor() {
		this.verticesLine = [];
		this.colorIndicesLine = [];
		this.elementsLine = [];
		this.normalsLine = [];
		this.tangentsLine = [];
		
		this.verticesPolygon = [];
		this.normalsPolygon = [];
  		this.tangentsPolygon = [];
		this.colorIndicesPolygon = [];
		this.elementsPolygon = [];
		
		this.minX = Infinity;
		this.maxX = -Infinity;
		this.minY = Infinity;
		this.maxY = -Infinity;
		this.minZ = Infinity;
		this.maxZ = -Infinity;
	}

	updateCenter(vertex) {
		this.minX = Math.min(this.minX, vertex[0]);
		this.maxX = Math.max(this.maxX, vertex[0]);
		
		this.minY = Math.min(this.minY, vertex[1]);
		this.maxY = Math.max(this.maxY, vertex[1]);

		this.minZ = Math.min(this.minZ, vertex[2]);
		this.maxZ = Math.max(this.maxZ, vertex[2]);
	}
	
	addVertexLine(vertex, colorIndex, normal, tangent) {		
		this.updateCenter(vertex);
		this.verticesLine.push(...vertex);
		this.colorIndicesLine.push(colorIndex);
		this.normalsLine.push(...normal);
		this.tangentsLine.push(...tangent);
	}
	
	addVertexPolygon(vertex, colorIndex, normal, tangent) {
		this.updateCenter(vertex);
		this.verticesPolygon.push(...vertex);
		this.colorIndicesPolygon.push(colorIndex);
		this.normalsPolygon.push(...normal);
		this.tangentsPolygon.push(...tangent);
	}
	
	addLine(start, end) {		
		this.elementsLine.push(start);	
		this.elementsLine.push(end);	
	}
	
	addPolygon(elements) {
		for (let i = 1; i < elements.length - 1; i ++) {			
			this.elementsPolygon.push(elements[i]);
			this.elementsPolygon.push(elements[i + 1]);
			this.elementsPolygon.push(elements[0]);
		}
	}
	
	getVertexLineBuffer() {
		return new Float32Array(this.verticesLine);
	}
	
	getColorIndexLineBuffer() {
		return new Float32Array(this.colorIndicesLine);
	}
	
	getElementLineBuffer() {
		return new Uint32Array(this.elementsLine);
	}

	getNormalLineBuffer() {
		return new Float32Array(this.normalsLine);
	}

	getTangentLineBuffer() {
		return new Float32Array(this.tangentsLine);
	}
	
	getVertexPolygonBuffer() {
		return new Float32Array(this.verticesPolygon);
	}
	
	getColorIndexPolygonBuffer() {
		return new Float32Array(this.colorIndicesPolygon);
	}
	
	getElementPolygonBuffer() {
		return new Uint32Array(this.elementsPolygon);
	}

	getNormalPolygonBuffer() {
		return new Float32Array(this.normalsPolygon);
	}

	getTangentPolygonBuffer() {
		return new Float32Array(this.tangentsPolygon);
	}
	
	centerX() {
		return (this.minX + this.maxX) / 2;
	}
	
	centerY() {
		return (this.minY + this.maxY) / 2;
	}

	centerZ() {
		return (this.minZ + this.maxZ) / 2;
	}

	maxDepth() {
		return Math.max(Math.abs(this.maxZ), Math.abs(this.minZ));
	}

}

