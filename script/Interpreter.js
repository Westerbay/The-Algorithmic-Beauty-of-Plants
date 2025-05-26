class Interpreter {

	constructor(turtle) {
		this.turtle = turtle;
		this.commands = [];
		initCommands();
	}
	
	addCommand(symbol, command) {
		this.commands[symbol] = command;
	}
	
	initCommands() {
		addCommand('F', this.turtle.moveForward);
		addCommand('f', this.turtle.moveForwardWithoutDrawing);
		addCommand('+', this.turtle.turnLeft);
		addCommand('-', this.turtle.turnRight);
		addCommand('∧', this.turtle.pitchUp);
		addCommand('^', this.turtle.pitchUp);
		addCommand('&', this.turtle.pitchDown);
		addCommand('\\', this.turtle.rollLeft);
		addCommand('/', this.turtle.rollRight);
		addCommand('|', this.turtle.turnAround);
		addCommand('$', this.turtle.rotateVertical);
		addCommand('[', this.turtle.startBranch);
		addCommand(']', this.turtle.completeBranch);
		addCommand('{', this.turtle.startPolygon);
		addCommand('G', this.turtle.moveForwardWithoutRecord);
		addCommand('.', this.turtle.recordVertex);
		addCommand('}', this.turtle.completePolygon);
		addCommand('∼', this.turtle.incorporateSurface);
		addCommand('!', this.turtle.decrementDiameter);
		addCommand('', this.turtle.incrementColor);
		addCommand('\'', this.turtle.incrementColor);
		addCommand('%', this.turtle.cutOffRemainderBranch);
	}
	
	execute(word) {
		for (const symbol of word) {
			this.commands[symbol]();
		}
	}

}

