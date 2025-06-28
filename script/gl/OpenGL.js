class OpenGL {

	constructor(glcontext) {
		this.gl = glcontext;
		this.camera = new Camera();			
		this.background = new Background();
		this.texture = new Texture(glcontext, this.background);
		this.modelGround = mat4.create();
		this.colors = [];	
		this.lightingEnabled = true;
		this.shadowEnabled = true;
		this.showSky = true;
		this.showGround = true;
		this.linePrimitive = false;
		this.shadowColor = [0, 0, 0, 0.9];
		this.mesh = null;
		this.initGL();
	}

	initGL() {
		this.initContext();
		this.initSky();
		this.initGround();
		this.createShaders();
	}

	initContext() {
		this.gl.getExtension('OES_element_index_uint');
		this.gl.enable(this.gl.BLEND);
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
	}

	initGround() {
		const gl = this.gl;
		this.vertexGroundBuffer = gl.createBuffer();
		this.normalGroundBuffer = gl.createBuffer();
		this.tangentGroundBuffer = gl.createBuffer();
		this.uvGroundBuffer = gl.createBuffer();
		this.elementGroundBuffer = gl.createBuffer();
		this.configBuffer(gl.ARRAY_BUFFER, this.vertexGroundBuffer, this.background.groundVertices);
		this.configBuffer(gl.ARRAY_BUFFER, this.normalGroundBuffer, this.background.groundNormals);
		this.configBuffer(gl.ARRAY_BUFFER, this.tangentGroundBuffer, this.background.groundTangent);
		this.configBuffer(gl.ARRAY_BUFFER, this.uvGroundBuffer, this.background.groundUVs);
		this.configBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementGroundBuffer, this.background.groundElements);
		this.elementGroundCount = this.background.groundElements.length;
	}

	initSky() {
		const gl = this.gl;
		this.vertexSkyBuffers = [];
		for (let i = 0; i < 6; i++) {
			this.vertexSkyBuffers[i] = gl.createBuffer();
		}
		this.normalSkyBuffer = gl.createBuffer();
		this.tangentSkyBuffer = gl.createBuffer();
		this.uvSkyBuffer = gl.createBuffer();
		this.elementSkyBuffer = gl.createBuffer();
		for (let i = 0; i < 6; i++) {
			this.configBuffer(gl.ARRAY_BUFFER, this.vertexSkyBuffers[i], this.background.skyVertices[i]);
		}
		this.configBuffer(gl.ARRAY_BUFFER, this.normalSkyBuffer, this.background.skyNormals);
		this.configBuffer(gl.ARRAY_BUFFER, this.tangentSkyBuffer, this.background.skyTangents);
		this.configBuffer(gl.ARRAY_BUFFER, this.uvSkyBuffer, this.background.skyUVs);
		this.configBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementSkyBuffer, this.background.skyElements);
		this.elementSkyCount = this.background.skyElements.length;
	}
	
	initShader(program, vsSource, fsSource, attributes, uniforms) {
		const gl = this.gl;	
		const vs = this.compileShader(vsSource, gl.VERTEX_SHADER);
		const fs = this.compileShader(fsSource, gl.FRAGMENT_SHADER);
		
		gl.attachShader(program, vs);
		gl.attachShader(program, fs);
		gl.linkProgram(program);
		gl.useProgram(program);
		
		var locations = {};
		for (let i = 0; i < attributes.length; i ++) {
			locations[attributes[i]] = gl.getAttribLocation(program, attributes[i]);
		}
		for (let i = 0; i < uniforms.length; i ++) {
			locations[uniforms[i]] = gl.getUniformLocation(program, uniforms[i]);
		}

		return locations;
	}
	
	compileShader(src, type) {
		const gl = this.gl;
		const shader = gl.createShader(type);
		gl.shaderSource(shader, src);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			throw new Error("Shader error: " + gl.getShaderInfoLog(shader));
		}
		return shader;
	}

	createShaders() {
		this.shader = new Shader();
		this.systemProgram = this.gl.createProgram();
		this.locationsSystem = this.initShader(
			this.systemProgram,
			this.shader.getVertexShaderSystem(),
			this.shader.getFragmentShaderSystem(),
			this.shader.getAttributesSystem(),
			this.shader.getUniformsSystem()
		);	
		
		this.backgroundProgram = this.gl.createProgram();
		this.locationsBackground = this.initShader(
			this.backgroundProgram,
			this.shader.getVertexShaderBackground(),
			this.shader.getFragmentShaderBackground(),
			this.shader.getAttributesBackground(),
			this.shader.getUniformsBackground()
		);
	}
	
	loadMesh(mesh) {	
		const gl = this.gl;		
		this.mesh = mesh;
		this.camera.setCenter(mesh.centerX(), mesh.centerY(), mesh.centerZ());	
		this.camera.setMaxDepth(mesh.maxDepth());
		this.camera.setMinHeight(mesh.minY);

		const mat = mat4.create();
		mat4.translate(this.modelGround, mat, [0, mesh.minY, 0]);
		
		const verticesLine = mesh.getVertexLineBuffer();
		const colorIndicesLine = mesh.getColorIndexLineBuffer();
		const elementsLine = mesh.getElementLineBuffer();
		const normalsLine = mesh.getNormalLineBuffer();
		const tangentsLine = mesh.getTangentLineBuffer();

		const verticesRod = mesh.getVertexRodBuffer();
		const colorIndicesRod = mesh.getColorIndexRodBuffer();
		const elementsRod = mesh.getElementRodBuffer();
		const normalsRod = mesh.getNormalRodBuffer();
		const tangentsRod = mesh.getTangentRodBuffer();

		const verticesLeaf = mesh.getVertexLeafBuffer();
		const colorIndicesLeaf = mesh.getColorIndexLeafBuffer();
		const elementsLeaf = mesh.getElementLeafBuffer();
		const normalsLeaf = mesh.getNormalLeafBuffer();
		const tangentsLeaf = mesh.getTangentLeafBuffer();
		
		this.vertexLineBuffer = gl.createBuffer();
		this.colorIndexLineBuffer = gl.createBuffer();	
		this.elementLineBuffer = gl.createBuffer();
		this.normalLineBuffer = gl.createBuffer();	
		this.tangentLineBuffer = gl.createBuffer();

		this.vertexRodBuffer = gl.createBuffer();			
		this.colorIndexRodBuffer = gl.createBuffer();		
		this.elementRodBuffer = gl.createBuffer();		
		this.normalRodBuffer = gl.createBuffer();		
		this.tangentRodBuffer = gl.createBuffer();

		this.vertexLeafBuffer = gl.createBuffer();			
		this.colorIndexLeafBuffer = gl.createBuffer();		
		this.elementLeafBuffer = gl.createBuffer();		
		this.normalLeafBuffer = gl.createBuffer();		
		this.tangentLeafBuffer = gl.createBuffer();

		this.configBuffer(gl.ARRAY_BUFFER, this.colorIndexLineBuffer, colorIndicesLine);
		this.configBuffer(gl.ARRAY_BUFFER, this.colorIndexRodBuffer, colorIndicesRod);
		this.configBuffer(gl.ARRAY_BUFFER, this.colorIndexLeafBuffer, colorIndicesLeaf);

		this.configBuffer(gl.ARRAY_BUFFER, this.vertexLineBuffer, verticesLine);
		this.configBuffer(gl.ARRAY_BUFFER, this.vertexRodBuffer, verticesRod);
		this.configBuffer(gl.ARRAY_BUFFER, this.vertexLeafBuffer, verticesLeaf);

		this.configBuffer(gl.ARRAY_BUFFER, this.normalLineBuffer, normalsLine);
		this.configBuffer(gl.ARRAY_BUFFER, this.normalRodBuffer, normalsRod);
		this.configBuffer(gl.ARRAY_BUFFER, this.normalLeafBuffer, normalsLeaf);

		this.configBuffer(gl.ARRAY_BUFFER, this.tangentLineBuffer, tangentsLine);
		this.configBuffer(gl.ARRAY_BUFFER, this.tangentRodBuffer, tangentsRod);
		this.configBuffer(gl.ARRAY_BUFFER, this.tangentLeafBuffer, tangentsLeaf);

		this.configBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementLineBuffer, elementsLine);	
		this.configBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementRodBuffer, elementsRod);
		this.configBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementLeafBuffer, elementsLeaf);
		
		this.elementLineCount = elementsLine.length;
		this.elementRodCount = elementsRod.length;
		this.elementLeafCount = elementsLeaf.length;
	}
	
	configBuffer(type, buffer, data) {
		const gl = this.gl;	
		gl.bindBuffer(type, buffer);
		gl.bufferData(type, data, gl.STATIC_DRAW);
	}

	render() {		
		const gl = this.gl;		
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.clearColor(0.95, 0.95, 0.95, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		const cameraMatrices = this.camera.computeMatrices(
			gl.canvas.width,
			gl.canvas.height
		); 
		const cameraMatrixBackground = cameraMatrices[0];
		const cameraMatrixWorld = cameraMatrices[1];		

		//Sky rendering
		if (this.texture.ready) {
			this.gl.disable(this.gl.DEPTH_TEST);		
			this.skyRendering(gl, cameraMatrixBackground);

			//Ground rendering
			this.gl.enable(this.gl.DEPTH_TEST);
			this.groundRendering(gl, cameraMatrixWorld);
		}

		//Mesh rendering
		this.meshRendering(gl, cameraMatrixWorld);
	}

	groundRendering(gl, camera) {
		if (!this.showGround) {
			return;
		}
		gl.useProgram(this.backgroundProgram);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture.ground);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.texture.groundNormal);
		gl.uniformMatrix4fv(this.locationsBackground['model'], false, this.modelGround);
		gl.uniformMatrix4fv(this.locationsBackground['cameraMatrix'], false, camera);
		gl.uniform1i(this.locationsBackground['uDiffuseMap'], 0);
		gl.uniform1i(this.locationsBackground['uNormalMap'], 1);
		gl.uniform3fv(this.locationsBackground['uLightPos'], this.background.lightPosition);
  		gl.uniform3fv(this.locationsBackground['uViewPos'], this.camera.position);
  		gl.uniform1i(this.locationsBackground['uEnableLighting'], this.lightingEnabled);
		this.bindVBO(this.vertexGroundBuffer, this.locationsBackground['aPosition'], 3);
		this.bindVBO(this.normalGroundBuffer, this.locationsBackground['aNormal'], 3);
		this.bindVBO(this.tangentGroundBuffer, this.locationsBackground['aTangent'], 3);
		this.bindVBO(this.uvGroundBuffer, this.locationsBackground['aUV'], 2);
		this.drawMode(this.elementGroundBuffer, gl.TRIANGLES, this.elementGroundCount);
	}

	skyRendering(gl, camera) {
		if (!this.showSky) {
			return;
		}
		gl.useProgram(this.backgroundProgram);
		gl.uniformMatrix4fv(this.locationsBackground['model'], false, mat4.create());
		gl.uniformMatrix4fv(this.locationsBackground['cameraMatrix'], false, camera);		
		gl.uniform1i(this.locationsBackground['uDiffuseMap'], 0);
		gl.uniform1i(this.locationsBackground['uNormalMap'], 1);
		gl.uniform3fv(this.locationsBackground['uLightPos'], this.background.lightPosition);
  		gl.uniform3fv(this.locationsBackground['uViewPos'], this.camera.position);
  		gl.uniform1i(this.locationsBackground['uEnableLighting'], false);
		this.bindVBO(this.normalSkyBuffer, this.locationsBackground['aNormal'], 3);
		this.bindVBO(this.tangentSkyBuffer, this.locationsBackground['aTangent'], 3);
		this.bindVBO(this.uvSkyBuffer, this.locationsBackground['aUV'], 2);

		gl.activeTexture(gl.TEXTURE0);
		for (let i = 0; i < 6; i++) {
			this.bindVBO(this.vertexSkyBuffers[i], this.locationsBackground['aPosition'], 3);
			gl.bindTexture(gl.TEXTURE_2D, this.texture.skies[i]);
			this.drawMode(this.elementSkyBuffer, gl.TRIANGLES, this.elementSkyCount);
		}
	}

	meshRendering(gl, camera) {
		const shadowColor = new Float32Array(this.shadowColor.flat());
		const shadowMat = this.getShadowMatrix();
		let shadowModel = mat4.create();
		mat4.multiply(shadowModel, shadowMat, this.modelGround);

		gl.useProgram(this.systemProgram);
		gl.uniformMatrix4fv(this.locationsSystem['cameraMatrix'], false, camera);
		gl.uniform3fv(this.locationsSystem['colorStack'], this.colors);
		gl.uniform1i(this.locationsSystem['colorStackLength'], this.colors.length);
		gl.uniform3fv(this.locationsSystem['uLightPos'], this.background.lightPosition);
  		gl.uniform3fv(this.locationsSystem['uViewPos'], this.camera.position);
		gl.uniform4fv(this.locationsSystem['shadowColor'], shadowColor);
  		gl.uniform1i(this.locationsSystem['uEnableLighting'], this.lightingEnabled);

		if (this.linePrimitive) {
			this.subMeshRendering(() => {
				this.bindVBO(this.normalLineBuffer, this.locationsSystem['aNormal'], 3);
				this.bindVBO(this.vertexLineBuffer, this.locationsSystem['aPosition'], 3);
				this.bindVBO(this.colorIndexLineBuffer, this.locationsSystem['aColorIndex'], 1);
				this.drawMode(this.elementLineBuffer, gl.LINES, this.elementLineCount);	
			}, shadowModel);			
		}
		else {
			this.subMeshRendering(() => {
				this.bindVBO(this.normalRodBuffer, this.locationsSystem['aNormal'], 3);
				this.bindVBO(this.vertexRodBuffer, this.locationsSystem['aPosition'], 3);
				this.bindVBO(this.colorIndexRodBuffer, this.locationsSystem['aColorIndex'], 1);
				this.drawMode(this.elementRodBuffer, gl.TRIANGLES, this.elementRodCount);
			}, shadowModel); 
		}

		this.subMeshRendering(() => {
			this.bindVBO(this.normalLeafBuffer, this.locationsSystem['aNormal'], 3);
			this.bindVBO(this.vertexLeafBuffer, this.locationsSystem['aPosition'], 3);
			this.bindVBO(this.colorIndexLeafBuffer, this.locationsSystem['aColorIndex'], 1);
			this.drawMode(this.elementLeafBuffer, gl.TRIANGLES, this.elementLeafCount);
		}, shadowModel);

	}

	subMeshRendering(meshRender, shadowModel) {
		const gl = this.gl;
		gl.uniform1i(this.locationsSystem['isShadow'], false);
		gl.uniformMatrix4fv(this.locationsSystem['model'], false, mat4.create());
		meshRender();
		if (this.shadowEnabled) {
			gl.uniform1i(this.locationsSystem['isShadow'], true);
			gl.uniformMatrix4fv(this.locationsSystem['model'], false, shadowModel);
			meshRender();
		}
	}
	
	bindVBO(buffer, location, numberElement) {
		const gl = this.gl;
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.enableVertexAttribArray(location);
		gl.vertexAttribPointer(location, numberElement, gl.FLOAT, false, 0, 0);
	}
	
	drawMode(ebo, mode, count) {
		const gl = this.gl;
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
		gl.drawElements(mode, count, gl.UNSIGNED_INT, 0);
	}

	getShadowMatrix() {
		var [lx, ly, lz] = this.background.lightPosition;
		return [
			1, 0, 0, 0,
			-lx/ly, 0, -lz/ly, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		];
	}

}

