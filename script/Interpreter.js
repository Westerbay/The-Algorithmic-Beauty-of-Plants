class Interpreter {

	constructor(turtle) {
		this.turtle = turtle;
		this.commands = [];
		this.initCommands();
	}
	
	addCommand(symbol, command) {
		this.commands[symbol] = command;
	}
	
	initCommands() {
		const t = this.turtle;
		this.addCommand('F', t.moveForward.bind(t));
		this.addCommand('f', t.moveForwardWithoutDrawing.bind(t));
		this.addCommand('+', t.turnLeft.bind(t));
		this.addCommand('-', t.turnRight.bind(t));
		this.addCommand('∧', t.pitchUp.bind(t));
		this.addCommand('^', t.pitchUp.bind(t));
		this.addCommand('&', t.pitchDown.bind(t));
		this.addCommand('\\', t.rollLeft.bind(t));
		this.addCommand('/', t.rollRight.bind(t));
		this.addCommand('|', t.turnAround.bind(t));
		this.addCommand('$', t.rotateVertical.bind(t));
		this.addCommand('[', t.startBranch.bind(t));
		this.addCommand(']', t.completeBranch.bind(t));
		this.addCommand('{', t.startPolygon.bind(t));
		this.addCommand('G', t.moveForwardWithoutRecord.bind(t));
		this.addCommand('.', t.recordVertex.bind(t));
		this.addCommand('}', t.completePolygon.bind(t));
		this.addCommand('∼', t.incorporateSurface.bind(t));
		this.addCommand('!', t.decrementDiameter.bind(t));
		this.addCommand('', t.incrementColor.bind(t));
		this.addCommand('\'', t.incrementColor.bind(t));
		this.addCommand('%', t.cutOffRemainderBranch.bind(t));
	}

	
	execute(word) {
		console.log(word);
		for (const symbol of word) {
			this.commands[symbol]();
		}
		return this.turtle.mesh;
	}

}

