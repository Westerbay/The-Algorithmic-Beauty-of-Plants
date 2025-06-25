class Texture {

    constructor(gl, background) {
        this.gl = gl;
        this.background = background;
        this.ready = false;
		this.initTextures();
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
		const gl = this.gl;		
		gl.activeTexture(gl.TEXTURE0);

		const groundDiffuse = await this.background.groundImage;
		this.ground = this.createTexture(groundDiffuse);				
		gl.bindTexture(gl.TEXTURE_2D, this.ground);
		this.enableAnisotropicFilter(this.ground);	

		const skyFront64 = await this.background.skyFrontImage;
		const skyBack64 = await this.background.skyBackImage;		
		const skyRight64 = await this.background.skyRightImage;
		const skyLeft64 = await this.background.skyLeftImage;
		const skyTop64 = await this.background.skyTopImage;
		const skyBottom64 = await this.background.skyBottomImage;
		this.skies = [
			this.createTexture(skyFront64),
			this.createTexture(skyBack64),
			this.createTexture(skyRight64),
			this.createTexture(skyLeft64),
			this.createTexture(skyTop64),
			this.createTexture(skyBottom64)
		];
		for (let i = 0; i < 6; i++) {
			gl.bindTexture(gl.TEXTURE_2D, this.skies[i]);
		}

		gl.activeTexture(gl.TEXTURE1);
		const groundNormal = await this.background.groundNormal;
		this.groundNormal = this.createTexture(groundNormal);				
		gl.bindTexture(gl.TEXTURE_2D, this.groundNormal);
		this.ready = true;
	}

}
