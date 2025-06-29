class TurtleMesh {

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

		this.verticesRod = [];
		this.colorIndicesRod = [];
		this.elementsRod = [];
		this.normalsRod = [];
		this.tangentsRod = [];

		this.verticesLeaf = [];
		this.colorIndicesLeaf = [];
		this.elementsLeaf = [];
		this.normalsLeaf = [];
		this.tangentsLeaf = [];
		
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
	
	addLine(startIdx, endIdx) {		
		this.elementsLine.push(startIdx);	
		this.elementsLine.push(endIdx);	
	}
	
	addPolygon(indices, length) {
		if (indices.length < 3) return;

		const verts = [];
		const normals = [];
		const tangents = [];
		const colors = [];
		for (let idx of indices) {
			verts.push([
				this.verticesPolygon[3*idx],
				this.verticesPolygon[3*idx+1],
				this.verticesPolygon[3*idx+2]
			]);
			normals.push([
				this.normalsPolygon[3*idx],
				this.normalsPolygon[3*idx+1],
				this.normalsPolygon[3*idx+2]
			]);
			tangents.push([
				this.tangentsPolygon[3*idx],
				this.tangentsPolygon[3*idx+1],
				this.tangentsPolygon[3*idx+2]
			]);
			colors.push(this.colorIndicesPolygon[idx]);
		}

		let avgNormal = [0,0,0];
		for (let n of normals) {
			avgNormal[0] += n[0];
			avgNormal[1] += n[1];
			avgNormal[2] += n[2];
		}
		const nLen = Math.hypot(avgNormal[0], avgNormal[1], avgNormal[2]);
		avgNormal = [avgNormal[0]/nLen, avgNormal[1]/nLen, avgNormal[2]/nLen];

		const epsilon = length * 1e-2;
		const vertsBack = verts.map(v => [
			v[0] - avgNormal[0]*epsilon,
			v[1] - avgNormal[1]*epsilon,
			v[2] - avgNormal[2]*epsilon
		]);
		const normalsBack = normals.map(n => [-n[0], -n[1], -n[2]]);
		const tangentsBack = tangents.map(t => [-t[0], -t[1], -t[2]]);

		const frontIndices = [];
		const backIndices = [];
		for (let i = 0; i < verts.length; i++) {
			this.updateCenter(verts[i]);
			this.verticesLeaf.push(...verts[i]);
			this.normalsLeaf.push(...normals[i]);
			this.tangentsLeaf.push(...tangents[i]);
			this.colorIndicesLeaf.push(colors[i]);
			frontIndices.push((this.verticesLeaf.length / 3) - 1);
		}
		for (let i = 0; i < vertsBack.length; i++) {
			this.updateCenter(vertsBack[i]);
			this.verticesLeaf.push(...vertsBack[i]);
			this.normalsLeaf.push(...normalsBack[i]);
			this.tangentsLeaf.push(...tangentsBack[i]);
			this.colorIndicesLeaf.push(colors[i]);
			backIndices.push((this.verticesLeaf.length / 3) - 1);
		}

		for (let i = 1; i < frontIndices.length - 1; i++) {
			this.elementsLeaf.push(frontIndices[0], frontIndices[i], frontIndices[i+1]);
		}
		for (let i = 1; i < backIndices.length - 1; i++) {
			this.elementsLeaf.push(backIndices[0], backIndices[i+1], backIndices[i]);
		}

		for (let i = 0; i < frontIndices.length; i++) {
			let next = (i + 1) % frontIndices.length;
			this.elementsLeaf.push(frontIndices[i], frontIndices[next], backIndices[next]);
			this.elementsLeaf.push(frontIndices[i], backIndices[next], backIndices[i]);
		}
	}

	addRod(startIdx, endIdx, diameter) {
		const start = [
			this.verticesLine[3*startIdx],
			this.verticesLine[3*startIdx+1],
			this.verticesLine[3*startIdx+2]
		];
		const end = [
			this.verticesLine[3*endIdx],
			this.verticesLine[3*endIdx+1],
			this.verticesLine[3*endIdx+2]
		];
		const colorStart = this.colorIndicesLine[startIdx];
		const colorEnd = this.colorIndicesLine[endIdx];

		const dir = [end[0] - start[0], end[1] - start[1], end[2] - start[2]];
		const len = Math.hypot(dir[0], dir[1], dir[2]);
		const d = [dir[0]/len, dir[1]/len, dir[2]/len];

		let up = Math.abs(d[1]) < 0.99 ? [0,1,0] : [1,0,0];
		let v1 = [
			d[1]*up[2] - d[2]*up[1],
			d[2]*up[0] - d[0]*up[2],
			d[0]*up[1] - d[1]*up[0]
		];
		let v1len = Math.hypot(v1[0], v1[1], v1[2]);
		v1 = [v1[0]/v1len, v1[1]/v1len, v1[2]/v1len];
		let v2 = [
			d[1]*v1[2] - d[2]*v1[1],
			d[2]*v1[0] - d[0]*v1[2],
			d[0]*v1[1] - d[1]*v1[0]
		];
		let v2len = Math.hypot(v2[0], v2[1], v2[2]);
		v2 = [v2[0]/v2len, v2[1]/v2len, v2[2]/v2len];

		let verts = [];
		let normals = [];
		let tangents = [];
		for (let i = 0; i < 4; i++) {
			let angle = Math.PI/2 * i;
			let cosA = Math.cos(angle);
			let sinA = Math.sin(angle);
			let offset = [
				diameter * (cosA * v1[0] + sinA * v2[0]),
				diameter * (cosA * v1[1] + sinA * v2[1]),
				diameter * (cosA * v1[2] + sinA * v2[2])
			];
			verts.push([
				start[0] + offset[0],
				start[1] + offset[1],
				start[2] + offset[2]
			]);
			let nlen = Math.hypot(offset[0], offset[1], offset[2]);
			normals.push([offset[0]/nlen, offset[1]/nlen, offset[2]/nlen]);
			tangents.push(d); 
		}
		for (let i = 0; i < 4; i++) {
			let angle = Math.PI/2 * i;
			let cosA = Math.cos(angle);
			let sinA = Math.sin(angle);
			let offset = [
				diameter * (cosA * v1[0] + sinA * v2[0]),
				diameter * (cosA * v1[1] + sinA * v2[1]),
				diameter * (cosA * v1[2] + sinA * v2[2])
			];
			verts.push([
				end[0] + offset[0],
				end[1] + offset[1],
				end[2] + offset[2]
			]);
			let nlen = Math.hypot(offset[0], offset[1], offset[2]);
			normals.push([offset[0]/nlen, offset[1]/nlen, offset[2]/nlen]);
			tangents.push(d);
		}

		let indices = [];
		for (let i = 0; i < 4; i++) {
			this.updateCenter(verts[i]);
			this.verticesRod.push(...verts[i]);
			this.normalsRod.push(...normals[i]);
			this.tangentsRod.push(...tangents[i]);
			this.colorIndicesRod.push(colorStart);
			indices.push((this.verticesRod.length / 3) - 1);
		}
		for (let i = 4; i < 8; i++) {
			this.updateCenter(verts[i]);
			this.verticesRod.push(...verts[i]);
			this.normalsRod.push(...normals[i]);
			this.tangentsRod.push(...tangents[i]);
			this.colorIndicesRod.push(colorEnd);
			indices.push((this.verticesRod.length / 3) - 1);
		}

		let faces = [
			[0,1,5,4], [1,2,6,5], [2,3,7,6], [3,0,4,7], [0,3,2,1], [4,5,6,7]
		];
		for (let f = 0; f < faces.length; f++) {
			let idx = faces[f].map(i => indices[i]);
			this.elementsRod.push(idx[0], idx[1], idx[2]);
			this.elementsRod.push(idx[0], idx[2], idx[3]);
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

	getVertexRodBuffer() {
		return new Float32Array(this.verticesRod);
	}

	getColorIndexRodBuffer() {
		return new Float32Array(this.colorIndicesRod);
	}

	getElementRodBuffer() {
		return new Uint32Array(this.elementsRod);
	}

	getNormalRodBuffer() {
		return new Float32Array(this.normalsRod);
	}

	getTangentRodBuffer() {
		return new Float32Array(this.tangentsRod);
	}

	getVertexLeafBuffer() {
		return new Float32Array(this.verticesLeaf);
	}

	getColorIndexLeafBuffer() {
		return new Float32Array(this.colorIndicesLeaf);
	}

	getElementLeafBuffer() {
		return new Uint32Array(this.elementsLeaf);
	}

	getNormalLeafBuffer() {
		return new Float32Array(this.normalsLeaf);
	}

	getTangentLeafBuffer() {
		return new Float32Array(this.tangentsLeaf);
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

