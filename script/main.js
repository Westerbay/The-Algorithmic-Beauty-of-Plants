function main() {
	const canvas = new Canvas();
	const sidebar = new Sidebar(canvas.openGL);
	sidebar.linkViews();
	canvas.linkViews();
	canvas.startRenderLoop();
	setTimeout(() => {
        canvas.openGL.texture.initTextures();
    }, 100);
}

document.addEventListener("DOMContentLoaded", main);



