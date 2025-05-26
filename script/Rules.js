class Rules {

	constructor() {
		this.simpleRules = [];
	}
	
	addSimpleRule(symbol, mutation) {
		this.simpleRules[symbol] = mutation;
	}
	
	getMutation(symbol) {
		if (symbol in this.simpleRules) {
			return this.simpleRules[symbol];
		}
		return symbol;
	}

}

