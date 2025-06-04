const presets = [];

function initPresets() {
	var rules = new Rules();
	rules.addSimpleRule('F', "FF-F-F-F-FF");
	var colors = ["#000000"];
	presets.push(new Preset(4, 2, 90, "F-F-F-F", rules, colors));
	
	rules = new Rules();
	rules.addSimpleRule('r', "-Fl-r");
	rules.addSimpleRule('l', "l+rF+");
	presets.push(new Preset(16, 1, 90, "Fl", rules, colors));
	
	rules = new Rules();
	rules.addSimpleRule('F', "FF-[-F+F+F]+[+F-F-F]");
	presets.push(new Preset(4, 6, 22.5, "F", rules, colors));
	
	rules = new Rules();
	rules.addSimpleRule('A', "B-F+CFC+F-D&F^D-F+&&CFC+F+B//");
	rules.addSimpleRule('B', "A&F^CFB^F^D^^-F-D^|F^B|FC^F^A//");
	rules.addSimpleRule('C', "|D^|F^B-F+C^F^A&&FA&F^C+F+B^F^D//");
	rules.addSimpleRule('D', "|CFB-F+B|FA&F^A&&FB-F+B|FC//");
	presets.push(new Preset(4, 10, 90, "A", rules, colors));
	
	rules = new Rules();
	rules.addSimpleRule('P', "I+[P+r]--//[--l]I[++l]-[Pr]++Pr");
	rules.addSimpleRule('p', "FF");
	rules.addSimpleRule('r', "[&&&p'/w////w////w////w////w]");
	rules.addSimpleRule('s', "sFs");
	rules.addSimpleRule('w', "['^F][{&&&&-f+f|-f+f}]");
	rules.addSimpleRule('I', "Fs[//&&l][//^^l]Fs");
	rules.addSimpleRule('l', "['{+f-ff-f+|+f-ff-f}]");
	colors = ["#886622", "#227722", "#DD0000"];
	presets.push(new Preset(5, 7, 22.5, "P", rules, colors));
}

function loadPreset(option, value) {
	option.loadPreset(presets[value]);
}

function main() {
	const canvasGL = new CanvasGL();
	const option = new Option(canvasGL.openGL);

	const toggleBtn = document.getElementById('toggleSidebar');
	const layout = document.getElementById('layout');
	const presets = document.getElementById("presets");
	const abop = document.getElementById("abop");

	toggleBtn.addEventListener('click', () => {
		layout.classList.toggle('collapsed');

		const isCollapsed = layout.classList.contains('collapsed');
		toggleBtn.setAttribute('aria-label', isCollapsed ? 'Show sidebar' : 'Hide sidebar');
	});

	presets.addEventListener('change', (e) => {
		const value = parseInt(e.target.value);
		loadPreset(option, value);
	});

	abop.addEventListener("submit", function (e) {
		e.preventDefault();
		option.fetchDataAndDraw();		
	});	
	
	initPresets();
	canvasGL.startRenderLoop();

	presets.value = "0";
	loadPreset(option, 0);
}

document.addEventListener("DOMContentLoaded", main);



