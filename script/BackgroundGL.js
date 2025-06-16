class Background {

    constructor() {
        this.initSky();
        this.initGround();
		this.groundImage = this.loadImageFromBase64(groundDiffuse64);
		this.groundNormal = this.loadImageFromBase64(groundNormal64);
		this.skyTopImage = this.loadImageFromBase64(skyTop64);
		this.skyBottomImage = this.loadImageFromBase64(skyBottom64);
		this.skyFrontImage = this.loadImageFromBase64(skyFront64);
		this.skyBackImage = this.loadImageFromBase64(skyBack64);
		this.skyLeftImage = this.loadImageFromBase64(skyLeft64);
		this.skyRightImage = this.loadImageFromBase64(skyRight64);
		this.lightPosition = new Float32Array([0, 100000, 100000]);
    }

    initSky() {
		this.skyVertices = [
			new Float32Array([1, -1, 1, -1, -1, 1, -1, 1, 1, 1, 1, 1]), // +Z (front)
			new Float32Array([-1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1]), // -Z (back)
			new Float32Array([1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, -1]), // +X (right)
			new Float32Array([-1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, 1]), // -X (left)
			new Float32Array([1, 1, 1, -1, 1, 1, -1, 1, -1, 1, 1, -1]), // +Y (top)
			new Float32Array([1, -1, -1, -1, -1, -1, -1, -1, 1, 1, -1, 1]) // -Y (bottom)
		];

		this.skyNormals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
		this.skyTangents = new Float32Array([1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0]);
		this.skyUVs = new Float32Array([1, 1, 0, 1, 0, 0, 1, 0]);
		this.skyElements = new Uint32Array([0, 1, 2, 0, 2, 3]);
	}

    initGround() {
        this.groundVertices = new Float32Array([
			-50.0, 0, 50.0, // 0
			50.0, 0, 50.0, // 1
			50.0, 0, -50.0, // 2
			-50.0, 0, -50.0, // 3
		]);
		this.groundNormals = new Float32Array([
			0, 1, 0,
			0, 1, 0,
			0, 1, 0,
			0, 1, 0
		]);
		this.groundTangent = new Float32Array([
			1, 0, 0,
			1, 0, 0,
			1, 0, 0,
			1, 0, 0
		]);
		this.groundUVs = new Float32Array([
			0, 0, // 0
			10, 0, // 1
			10, 10, // 2
			0, 10  // 3
		]);
		this.groundElements = new Uint32Array([
			0, 1, 2, 0, 2, 3
		]);
    }

	loadImageFromBase64(base64Data) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = base64Data; // <- contient déjà toutes les données
		});
	}



}
