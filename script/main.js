function main() {
	var rules = new Rules();
	rules.addSimpleRule('F', "FF-[-F+F+F]+[+F-F-F]");
	var lSystem = new LSystem("F", rules);
	var turtleState = new TurtleState(0.01, 22.5, vec3.fromValues(0, -0.5, 0));
	
	var turtle = new Turtle(turtleState);
	var interpreter = new Interpreter(turtle);
	var mesh = interpreter.execute(lSystem.wordAtGeneration(5));	
	var canvasGL = new CanvasGL(mesh);
}

