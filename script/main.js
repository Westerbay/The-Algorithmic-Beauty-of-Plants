const rulesContainer = document.getElementById("rulesContainer");
const colorStack = document.getElementById("colorStack");
const colorInput = document.getElementById("newColor");

function addRule(symbol="", mutation="") {
	const row = document.createElement("div");
	row.className = "rule-row";
	
	const inputSymbol = document.createElement("input");
	inputSymbol.type = "text";
	inputSymbol.maxLength = 1;
	inputSymbol.placeholder = "Symbol";
	inputSymbol.value = symbol;
	inputSymbol.required = true;
	
	const inputMutation = document.createElement("input");
	inputMutation.type = "text";
	inputMutation.placeholder = "Mutation";
	inputMutation.value = mutation;
	inputMutation.required = true;
	
	const removeBtn = document.createElement("button");
	removeBtn.className = "remove-btn";
	removeBtn.textContent = "x";
	removeBtn.onclick = () => rulesContainer.removeChild(row);
	
	
	row.appendChild(inputSymbol);
	row.appendChild(inputMutation);
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

function main() {
	document.getElementById("abop").addEventListener("submit", function (e) {
		e.preventDefault();
	});

	var rules = new Rules();
	rules.addSimpleRule('F', "FF-[-F+F+F]+[+F-F-F]");
	var lSystem = new LSystem("F", rules);
	var turtleState = new TurtleState(0.03, 22.5, vec3.fromValues(0, 0, 0));
	
	var turtle = new Turtle(turtleState);
	var interpreter = new Interpreter(turtle);
	var mesh = interpreter.execute(lSystem.wordAtGeneration(5));	
	var canvasGL = new CanvasGL(mesh);
	
	addRule("F", "FF-[-F+F+F]+[+F-F-F]");
}

main();
document.getElementById("toggleSidebar").addEventListener("click", function () {
  document.getElementById("layout").classList.toggle("collapsed");
});


