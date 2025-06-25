class Sidebar {

	constructor(openGL) {
		this.openGL = openGL;
		this.presets = new Preset().generatePresetSamples();
		this.lastLength = 0;
		this.lastScaleDiameter = 0;
		this.lastAngleRotation = 0;
		this.lastAxiom = "";
		this.lastRules = new Rules();
		this.colorLimits = 16;
	}

	linkViews() {
		this.rulesContainer = document.getElementById("rulesContainer");
		this.addRuleButton = document.getElementById("addRule");
		this.addRuleButton.onclick = () => this.addSimpleRule();
		this.addColorButton = document.getElementById("addColor");
		this.addColorButton.onclick = () => this.addColor();
		this.colorStack = document.getElementById("colorStack");
		this.generationInput = document.getElementById("generation");
		this.lengthInput = document.getElementById("length");
		this.scaleDiameterPercentInput = document.getElementById("diameter");
		this.angleInput = document.getElementById("angle");
		this.axiomInput = document.getElementById("axiom");
		this.toggleBtn = document.getElementById('toggleSidebar');
		this.presetsSelect = document.getElementById("presets");
		this.layout = document.getElementById('layout');		
		this.form = document.getElementById("abop");
		this.addEventListeners();
	}

	addEventListeners() {
		this.generationInput.addEventListener("change", () => {
			this.lastGeneration = parseInt(this.generationInput.value, 10);
			this.draw(this.lastGeneration, this.lastLength, this.lastScaleDiameter, this.lastAngleRotation, this.lastAxiom, this.lastRules);
		});
		this.lengthInput.addEventListener("change", () => {
			this.lastLength = parseFloat(this.lengthInput.value);
			this.draw(this.lastGeneration, this.lastLength, this.lastScaleDiameter, this.lastAngleRotation, this.lastAxiom, this.lastRules);
		});
		this.angleInput.addEventListener("change", () => {
			this.lastAngleRotation = parseFloat(this.angleInput.value);
			this.draw(this.lastGeneration, this.lastLength, this.lastScaleDiameter, this.lastAngleRotation, this.lastAxiom, this.lastRules);
		});
		this.scaleDiameterPercentInput.addEventListener("change", () => {
			this.lastScaleDiameter = parseFloat(this.scaleDiameterPercentInput.value);
			this.draw(this.lastGeneration, this.lastLength, this.lastScaleDiameter, this.lastAngleRotation, this.lastAxiom, this.lastRules);
		});
		this.toggleBtn.addEventListener('click', () => {
			this.layout.classList.toggle('collapsed');
			const isCollapsed = this.layout.classList.contains('collapsed');
			this.toggleBtn.setAttribute('aria-label', isCollapsed ? 'Show sidebar' : 'Hide sidebar');
		});
		this.presetsSelect.addEventListener('change', (e) => {
			const value = parseInt(e.target.value);
			this.loadPreset(this.presets[value]);
		});
		this.form.addEventListener("submit", (e) => {
			e.preventDefault();
			this.fetchDataAndDraw();		
		});	
		const value = parseInt(this.presetsSelect.value);
		this.loadPreset(this.presets[value]);
	}
	
	addSimpleRule(symbol="", mutation="") {
		const row = document.createElement("div");
		row.className = "rule-row";
		
		const inputSymbol = document.createElement("input");
		inputSymbol.type = "text";
		inputSymbol.maxLength = 1;
		inputSymbol.placeholder = "F";
		inputSymbol.value = symbol;
		inputSymbol.required = true;
		
		const inputMutation = document.createElement("input");
		inputMutation.type = "text";
		inputMutation.placeholder = "FF-[-F+F+F]+[+F-F-F]";
		inputMutation.value = mutation;
		inputMutation.required = true;
		
		const removeBtn = document.createElement("button");
		removeBtn.className = "remove-btn";
		removeBtn.type = "button";
		removeBtn.textContent = "x";
		removeBtn.onclick = () => rulesContainer.removeChild(row);
		
		row.appendChild(inputSymbol);
		row.appendChild(inputMutation);
		row.appendChild(removeBtn);
		this.rulesContainer.appendChild(row);
	}
	
	addColor(color = "#000000") {
		if (this.colorStack.querySelectorAll(".color-item").length >= this.colorLimits) {
			alert("Maximum of " + this.colorLimits + " colors reached.");
			return;
		}
		
		const item = document.createElement("div");
		item.className = "color-item";
		
		const colorInput = document.createElement("input");
		colorInput.type = "color";
		colorInput.className = "color-box";
		colorInput.value = color;
		colorInput.addEventListener("change", () => {
		    this.loadColorStack();
		});
		
		const removeBtn = document.createElement("button");
		removeBtn.className = "remove-btn";
		removeBtn.type = "button";
		removeBtn.textContent = "x";
		removeBtn.onclick = () => colorStack.removeChild(item);
		
		item.appendChild(colorInput);
		item.appendChild(removeBtn);
		this.colorStack.appendChild(item);
	}
	
	hexToRgbGL(hex) {
		hex = hex.replace('#', '');
		const bigint = parseInt(hex, 16);
		const r = (bigint >> 16) & 255;
		const g = (bigint >> 8) & 255;
		const b = bigint & 255;
		return [r / 255, g / 255, b / 255];
	}
	
	loadColorStack() {
		const colors = [];
		document.querySelectorAll("#colorStack .color-item").forEach(row => {
			const inputs = row.querySelectorAll("input");
			if (inputs.length >= 1) {
				const color = inputs[0].value;
				colors.push(color);
			}
		});
		var colorsGL = [];
		for (var color of colors) {
			colorsGL.push(this.hexToRgbGL(color));
		}
		this.openGL.colors = new Float32Array(colorsGL.flat());	
	}
	
	draw(generation, length, scaleDiameter, angleRotation, axiom, rules) {
		this.lastGeneration = generation;
		this.lastLength = length;
		this.lastAngleRotation = angleRotation;
		this.lastAxiom = axiom;
		this.lastRules = rules;
		this.lastScaleDiameter = scaleDiameter;
		
		const lSystem = new LSystem(axiom, rules);
		const turtleState = new TurtleState(length * 0.01, vec3.fromValues(0, 0, 0), 0, scaleDiameter * 0.01);
		const turtle = new Turtle(turtleState, angleRotation);
		const interpreter = new Interpreter(turtle);
		const mesh = interpreter.execute(lSystem.wordAtGeneration(generation));
		
		this.loadColorStack();
		this.openGL.loadMesh(mesh);
	}
	
	fetchDataAndDraw() {
		const generation = parseInt(this.generationInput.value, 10);
		const length = parseFloat(this.lengthInput.value);
		const angleRotation = parseFloat(this.angleInput.value);
		const axiom = this.axiomInput.value;
		const scaleDiameter = parseFloat(this.scaleDiameterPercentInput.value);
		
		const rules = new Rules();
		document.querySelectorAll("#rulesContainer .rule-row").forEach(row => {
			const inputs = row.querySelectorAll("input");
			if (inputs.length >= 2) {
				const symbol = inputs[0].value.trim();
				const mutation = inputs[1].value.trim();
				if (symbol && mutation) {
					rules.addSimpleRule(symbol, mutation);
				}
			}
		});
		
		this.draw(generation, length, scaleDiameter, angleRotation, axiom, rules);
	}
	
	loadPreset(preset) {	
		this.colorStack.innerHTML = '';
		this.rulesContainer.innerHTML = '';

		this.generationInput.value = preset.generation;
		this.lengthInput.value = preset.length;
		this.angleInput.value = preset.angle;
		this.axiomInput.value = preset.axiom;
		this.scaleDiameterPercentInput.value = preset.scaleDiameterPercent;

		for (var [key, value] of Object.entries(preset.rules.simpleRules)) {
			this.addSimpleRule(key, value);
		}
		for (var color of preset.colors) {
			this.addColor(color);
		}		
		
		this.fetchDataAndDraw();	
	}

}

