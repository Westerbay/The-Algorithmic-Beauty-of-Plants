class OpenGL {

	constructor(glcontext) {
		this.gl = glcontext;
		this.gl.getExtension('OES_element_index_uint');

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

		this.modelGround = mat4.create();
		this.colors = [];	
		this.camera = new Camera();			
		this.background = new Background(glcontext);
		this.initTextures();
		this.initSky();	
		this.initGround();
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
		this.vertexSkyBuffer = gl.createBuffer();
		this.elementSkyBuffer = gl.createBuffer();
		this.colorSkyBuffer = gl.createBuffer();
		this.configBuffer(gl.ARRAY_BUFFER, this.vertexSkyBuffer, this.background.skyVertices);
		this.configBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementSkyBuffer, this.background.skyElements);
		this.configBuffer(gl.ARRAY_BUFFER, this.colorSkyBuffer, this.background.skyColorIndices);
		this.elementSkyCount = this.background.skyElements.length;
	}

	enableAnisotropicFilter(texture) {
		const gl = this.gl;	
		const ext = gl.getExtension('EXT_texture_filter_anisotropic')
			|| gl.getExtension('MOZ_EXT_texture_filter_anisotropic')
			|| gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');

		if (ext) {
			gl.bindTexture(gl.TEXTURE_2D, texture);
			const maxAniso = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
			gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, maxAniso);
		}
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
	
	loadMesh(mesh) {	
		const gl = this.gl;		
		this.camera.setCenter(mesh.centerX(), mesh.centerY(), mesh.centerZ());	
		this.camera.setMaxDepth(mesh.maxDepth());
		this.camera.setMinHeight(mesh.minY);

		const mat = mat4.create();
		mat4.translate(this.modelGround, mat, [0, mesh.minY, 0]);
		
		const verticesLine = mesh.getVertexLineBuffer();
		const colorIndicesLine = mesh.getColorIndexLineBuffer();
		const elementsLine = mesh.getElementLineBuffer();
		const verticesPolygon = mesh.getVertexPolygonBuffer();
		const colorIndicesPolygon = mesh.getColorIndexPolygonBuffer();
		const elementsPolygon = mesh.getElementPolygonBuffer();
		
		this.vertexLineBuffer = gl.createBuffer();
		this.configBuffer(gl.ARRAY_BUFFER, this.vertexLineBuffer, verticesLine);
		this.vertexPolygonBuffer = gl.createBuffer();
		this.configBuffer(gl.ARRAY_BUFFER, this.vertexPolygonBuffer, verticesPolygon);
		
		this.colorIndexLineBuffer = gl.createBuffer();
		this.configBuffer(gl.ARRAY_BUFFER, this.colorIndexLineBuffer, colorIndicesLine);
		this.colorIndexPolygonBuffer = gl.createBuffer();
		this.configBuffer(gl.ARRAY_BUFFER, this.colorIndexPolygonBuffer, colorIndicesPolygon);
		
		this.elementLineBuffer = gl.createBuffer();
		this.configBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementLineBuffer, elementsLine);
		
		this.elementPolygonBuffer = gl.createBuffer();
		this.configBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementPolygonBuffer, elementsPolygon);
		
		this.elementLineCount = elementsLine.length;
		this.elementPolygonCount = elementsPolygon.length;
	}
	
	configBuffer(type, buffer, data) {
		const gl = this.gl;	
		gl.bindBuffer(type, buffer);
		gl.bufferData(type, data, gl.STATIC_DRAW);
	}

	createTexture(image) {
		const gl = this.gl;	
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			image
		);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.generateMipmap(gl.TEXTURE_2D);

		return texture;
	}

	async initTextures() {
		const image = await this.background.groundImage;
		this.textureGround = this.createTexture(image);
		this.enableAnisotropicFilter(this.textureGround);
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.textureGround);
	}


	render() {		
		const gl = this.gl;		
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.clearColor(1, 1, 1, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		const cameraMatrices = this.camera.computeMatrices(
			gl.canvas.width,
			gl.canvas.height
		); 
		const cameraMatrixBackground = cameraMatrices[0];
		const cameraMatrixWorld = cameraMatrices[1];		

		//Sky rendering
		this.gl.disable(this.gl.DEPTH_TEST);		
		this.skyRendering(gl, cameraMatrixBackground);

		//Ground rendering
		this.gl.enable(this.gl.DEPTH_TEST);
		this.groundRendering(gl, cameraMatrixWorld);

		//Mesh rendering
		this.meshRendering(gl, cameraMatrixWorld);
	}

	groundRendering(gl, camera) {
		gl.useProgram(this.backgroundProgram);
		gl.uniformMatrix4fv(this.locationsBackground['model'], false, this.modelGround);
		gl.uniformMatrix4fv(this.locationsBackground['cameraMatrix'], false, camera);
		gl.uniform1i(this.locationsBackground['uDiffuseMap'], 0);
		gl.uniform1i(this.locationsBackground['uNormalMap'], 1);
		gl.uniform3fv(this.locationsBackground['uLightPos'], this.background.lightPosition);
  		gl.uniform3fv(this.locationsBackground['uViewPos'], this.camera.computePosition());
  		gl.uniform1i(this.locationsBackground['uEnableLighting'], false);
		this.bindVBO(this.vertexGroundBuffer, this.locationsBackground['aPosition'], 3);
		this.bindVBO(this.normalGroundBuffer, this.locationsBackground['aNormal'], 3);
		this.bindVBO(this.tangentGroundBuffer, this.locationsBackground['aTangent'], 3);
		this.bindVBO(this.uvGroundBuffer, this.locationsBackground['aUV'], 2);
		this.drawMode(this.elementGroundBuffer, gl.TRIANGLES, this.elementGroundCount);
	}

	skyRendering(gl, camera) {
		gl.useProgram(this.systemProgram);
		gl.uniformMatrix4fv(this.locationsSystem['model'], false, mat4.create());
		gl.uniformMatrix4fv(this.locationsSystem['cameraMatrix'], false, camera);
		gl.uniform3fv(this.locationsSystem['colorStack'], this.background.skyColors);
		gl.uniform1i(this.locationsSystem['colorStackLength'], this.background.skyColors.length);
		this.bindVBO(this.vertexSkyBuffer, this.locationsSystem['aPosition'], 3);
		this.bindVBO(this.colorSkyBuffer, this.locationsSystem['aColorIndex'], 1);
		this.drawMode(this.elementSkyBuffer, gl.TRIANGLES, this.elementSkyCount);
	}

	meshRendering(gl, camera) {
		gl.useProgram(this.systemProgram);
		gl.uniformMatrix4fv(this.locationsSystem['model'], false, mat4.create());
		gl.uniformMatrix4fv(this.locationsSystem['cameraMatrix'], false, camera);
		gl.uniform3fv(this.locationsSystem['colorStack'], this.colors);
		gl.uniform1i(this.locationsSystem['colorStackLength'], this.colors.length);

		this.bindVBO(this.vertexLineBuffer, this.locationsSystem['aPosition'], 3);
		this.bindVBO(this.colorIndexLineBuffer, this.locationsSystem['aColorIndex'], 1);
		this.drawMode(this.elementLineBuffer, gl.LINES, this.elementLineCount);

		this.bindVBO(this.vertexPolygonBuffer, this.locationsSystem['aPosition'], 3);
		this.bindVBO(this.colorIndexPolygonBuffer, this.locationsSystem['aColorIndex'], 1);
		this.drawMode(this.elementPolygonBuffer, gl.TRIANGLES, this.elementPolygonCount);
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

}

