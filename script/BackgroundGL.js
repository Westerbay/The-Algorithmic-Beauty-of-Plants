class Background {

    constructor() {
        this.initSky();
        this.initGround();
    }

    initSky() {
		this.skyVertices = new Float32Array([
			-1.0, -1.0, 1.0, // 0
			1.0, -1.0, 1.0, // 1
			1.0, 1.0, 1.0, // 2
			-1.0, 1.0, 1.0, // 3
			-1.0, -1.0, -1.0, // 4
			1.0, -1.0, -1.0, // 5
			1.0, 1.0, -1.0, // 6
			-1.0, 1.0, -1.0 // 7
		]);
		this.skyElements = new Uint32Array([
			0, 1, 2, 0, 2, 3,
			4, 5, 6, 4, 6, 7,
			0, 1, 5, 0, 5, 4,
			2, 3, 7, 2, 7, 6,
			0, 3, 7, 0, 7, 4,
			1, 2, 6, 1, 6, 5
		]);

		const colors = [];
		colors.push([0.89, 0.97, 0.98]); // Very Light Blue
		colors.push([0.53, 0.81, 0.92]); // Light Blue
		this.skyColors = new Float32Array(colors.flat());
		this.skyColorIndices = new Float32Array([
			0, 0, 1, 1, 0, 0, 1, 1
		]);
	}

    initGround() {
        this.groundVertices = new Float32Array([
			-1000.0, 0, 1000.0, // 0
			1000.0, 0, 1000.0, // 1
			1000.0, 0, -1000.0, // 2
			-1000.0, 0, -1000.0, // 3
		]);
		this.groundElements = new Uint32Array([
			0, 1, 2, 0, 2, 3
		]);

		const colors = [];
		colors.push([0.8, 0.8, 0.8]); // Light Gray
		this.groundColors = new Float32Array(colors.flat());
		this.groundColorIndices = new Float32Array([
			0, 0, 0, 0
		]);
    }

}
