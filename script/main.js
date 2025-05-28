const rulesContainer = document.getElementById("rulesContainer");
const colorStack = document.getElementById("colorStack");

const canvasGL = new CanvasGL();

function addRule(symbol="", mutation="") {
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
	removeBtn.textContent = "x";
	removeBtn.onclick = () => rulesContainer.removeChild(row);
	
	
	row.appendChild(inputSymbol);
	row.appendChild(inputMutation);
	row.appendChild(removeBtn);
	rulesContainer.appendChild(row);
}

function addColor() {
	const item = document.createElement("div");
	item.className = "color-item";
	
	const colorInput = document.createElement("input");
	colorInput.type = "color";
	colorInput.className = "color-box";
	colorInput.value = "#000000";
	colorInput.addEventListener("change", () => {
        loadColorStack();
    });
	
	const removeBtn = document.createElement("button");
	removeBtn.className = "remove-btn";
	removeBtn.textContent = "x";
	removeBtn.onclick = () => colorStack.removeChild(item);
	
	item.appendChild(colorInput);
	item.appendChild(removeBtn);
	colorStack.appendChild(item);
}

function hexToRgbGL(hex) {
	hex = hex.replace('#', '');
	const bigint = parseInt(hex, 16);
	const r = (bigint >> 16) & 255;
	const g = (bigint >> 8) & 255;
	const b = bigint & 255;
	return [r / 255, g / 255, b / 255];
}

function draw(generation, length, angleRotation, axiom, rules) {
	var lSystem = new LSystem(axiom, rules);
	var turtleState = new TurtleState(length * 0.01, vec3.fromValues(0, 0, 0), 0);
	
	var turtle = new Turtle(turtleState, angleRotation);
	var interpreter = new Interpreter(turtle);
	var mesh = interpreter.execute(lSystem.wordAtGeneration(generation));
	
	loadColorStack();
	canvasGL.loadMesh(mesh);
}

function loadColorStack() {
	const colors = [];
	document.querySelectorAll("#colorStack .color-item").forEach(row => {
		const inputs = row.querySelectorAll("input");
		if (inputs.length >= 1) {
			const color = inputs[0].value;
			colors.push(color);
		}
	});
	var colorsGL = [];
	for (color of colors) {
		colorsGL.push(hexToRgbGL(color));
	}
	canvasGL.colors = new Float32Array(colorsGL.flat());	
}

function fetchDataAndDraw() {
	const generation = parseInt(document.getElementById("generation").value, 10);
	const length = parseFloat(document.getElementById("length").value);
	const angleRotation = parseFloat(document.getElementById("angle").value);
	const axiom = document.getElementById("axiom").value;
	
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
	
	draw(generation, length, angleRotation, axiom, rules);
}

function main() {
	document.getElementById("abop").addEventListener("submit", function (e) {
		e.preventDefault();
		fetchDataAndDraw();		
	});	
	
	addColor();
	addRule("F", "FF-[-F+F+F]+[+F-F-F]");
	
	var rules = new Rules();
	rules.addSimpleRule('F', "FF-[-F+F+F]+[+F-F-F]"); 
	draw(5, 3, 22.5, "F", rules);
	
	canvasGL.startRenderLoop();
}

document.addEventListener("DOMContentLoaded", main);



