class Mesh {

	constructor() {
		this.verticesLine = [];
		this.colorIndicesLine = [];
		this.elementsLine = [];
		
		this.verticesPolygon = [];
		this.colorIndicesPolygon = [];
		this.elementsPolygon = [];
		
		this.minX = Infinity;
		this.maxX = -Infinity;
		this.minY = Infinity;
		this.maxY = -Infinity;
	}
	
	addVertexLine(vertex, colorIndex) {
		this.minX = Math.min(this.minX, vertex[0]);
		this.maxX = Math.max(this.maxX, vertex[0]);
		
		this.minY = Math.min(this.minY, vertex[1]);
		this.maxY = Math.max(this.maxY, vertex[1]);
		
		this.verticesLine.push(...vertex);
		this.colorIndicesLine.push(colorIndex);
	}
	
	addVertexPolygon(vertex, colorIndex) {
		this.minX = Math.min(this.minX, vertex[0]);
		this.maxX = Math.max(this.maxX, vertex[0]);
		
		this.minY = Math.min(this.minY, vertex[1]);
		this.maxY = Math.max(this.maxY, vertex[1]);
		
		this.verticesPolygon.push(...vertex);
		this.colorIndicesPolygon.push(colorIndex);
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
	
	getVertexPolygonBuffer() {
		return new Float32Array(this.verticesPolygon);
	}
	
	getColorIndexPolygonBuffer() {
		return new Float32Array(this.colorIndicesPolygon);
	}
	
	getElementPolygonBuffer() {
		return new Uint32Array(this.elementsPolygon);
	}
	
	centerX() {
		return (this.minX + this.maxX) / 2;
	}
	
	centerY() {
		return (this.minY + this.maxY) / 2;
	}

}

