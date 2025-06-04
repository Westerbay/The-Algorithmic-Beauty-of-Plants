class Option {

	constructor(openGL) {
		this.openGL = openGL;
		this.rulesContainer = document.getElementById("rulesContainer");
		this.addRuleButton = document.getElementById("addRule");
		this.addRuleButton.onclick = () => this.addSimpleRule();
		this.addColorButton = document.getElementById("addColor");
		this.addColorButton.onclick = () => this.addColor();
		this.colorStack = document.getElementById("colorStack");
		this.generationInput = document.getElementById("generation");
		this.lengthInput = document.getElementById("length");
		this.angleInput = document.getElementById("angle");
		this.axiomInput = document.getElementById("axiom");
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
		if (this.colorStack.querySelectorAll(".color-item").length >= 16) {
			alert("Maximum of 16 colors reached.");
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
	
	draw(generation, length, angleRotation, axiom, rules) {
		const lSystem = new LSystem(axiom, rules);
		const turtleState = new TurtleState(length * 0.01, vec3.fromValues(0, 0, 0), 0);
		
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
		
		this.draw(generation, length, angleRotation, axiom, rules);
	}
	
	loadPreset(preset) {	
		this.colorStack.innerHTML = '';
		this.rulesContainer.innerHTML = '';

		this.generationInput.value = preset.generation;
		this.lengthInput.value = preset.length;
		this.angleInput.value = preset.angle;
		this.axiomInput.value = preset.axiom;
		
		for (var [key, value] of Object.entries(preset.rules.simpleRules)) {
			this.addSimpleRule(key, value);
		}
		for (var color of preset.colors) {
			this.addColor(color);
		}		
		
		this.fetchDataAndDraw();	
	}

}

