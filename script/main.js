function main() {
	const canvas = new Canvas();
	const sidebar = new Sidebar(canvas.openGL);
	sidebar.linkViews();
	canvas.linkViews();
	canvas.startRenderLoop();
}

document.addEventListener("DOMContentLoaded", main);



