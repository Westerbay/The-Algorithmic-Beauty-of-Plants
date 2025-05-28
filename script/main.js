const rulesContainer = document.getElementById("rulesContainer");
const colorStack = document.getElementById("colorStack");
const colorInput = document.getElementById("newColor");

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
	const color = colorInput.value;
	const item = document.createElement("div");
	item.className = "color-item";
	
	const box = document.createElement("div");
	box.className = "color-box";
	box.style.backgroundColor = color;
	
	const removeBtn = document.createElement("button");
	removeBtn.className = "remove-btn";
	removeBtn.textContent = "x";
	removeBtn.onclick = () => colorStack.removeChild(item);
	
	item.appendChild(box);
	item.appendChild(removeBtn);
	colorStack.appendChild(item);
}

function draw(generation, length, angleRotation, axiom, rules, colors) {
	var lSystem = new LSystem(axiom, rules);
	var turtleState = new TurtleState(length * 0.01, vec3.fromValues(0, 0, 0), 0);
	
	var turtle = new Turtle(turtleState, angleRotation, colors);
	var interpreter = new Interpreter(turtle);
	var mesh = interpreter.execute(lSystem.wordAtGeneration(generation));
	canvasGL.loadBuffers(mesh);	
}

function main() {
	document.getElementById("abop").addEventListener("submit", function (e) {
		e.preventDefault();
		
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
		
		draw(generation, length, angleRotation, axiom, rules, []);
	});	
	
	addRule("F", "FF-[-F+F+F]+[+F-F-F]");
	
	var rules = new Rules();
	rules.addSimpleRule('F', "FF-[-F+F+F]+[+F-F-F]"); 
	draw(5, 3, 22.5, "F", rules, []);
	
	canvasGL.startRenderLoop();
}

main();


