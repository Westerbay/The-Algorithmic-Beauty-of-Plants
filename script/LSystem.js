class LSystem {

	constructor(axiom, rules) {
		this.generations = [axiom];
		this.rules = rules;
	}
	
	wordAtGeneration(gen) {
		if (this.generations.length > gen) {
			return this.generations[gen];
		}
		var word = wordAtGeneration(gen - 1);
		var newWord = "";
		for (const symbol of word) {
			newWord += this.rules.getMutation(symbol);
		}
		this.generations[gen] = newWord;
		return newWord;
	}

}

