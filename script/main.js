function main() {
	const canvas = new Canvas();
	const sidebar = new Sidebar(canvas.openGL);
	sidebar.linkViews();
	canvas.linkViews();
	canvas.startRenderLoop();
	window.addEventListener("load", () => {
        canvas.openGL.texture.initTextures();
    });
}

document.addEventListener("DOMContentLoaded", main);



