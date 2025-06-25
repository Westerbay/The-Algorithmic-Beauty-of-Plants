class Preset {

	constructor(generation, length, scaleDiameterPercent, angle, axiom, rules, colors) {
		this.generation = generation;
		this.length = length;
		this.angle = angle;
		this.axiom = axiom;
		this.rules = rules;
		this.colors = colors;
		this.scaleDiameterPercent = scaleDiameterPercent;
	}

	generatePresetSamples() {	
		const presets = [];
		var rules = new Rules();
		rules.addSimpleRule('F', "FF-[-F+F+F]+[+F-F-F]");
		var colors = ["#12BC86"];
		presets.push(new Preset(4, 6, 20, 22.5, "F", rules, colors));
		
		rules = new Rules();
		rules.addSimpleRule('A', "B-F+CFC+F-D&F^D-F+&&CFC+F+B//");
		rules.addSimpleRule('B', "A&F^CFB^F^D^^-F-D^|F^B|FC^F^A//");
		rules.addSimpleRule('C', "|D^|F^B-F+C^F^A&&FA&F^C+F+B^F^D//");
		rules.addSimpleRule('D', "|CFB-F+B|FA&F^A&&FB-F+B|FC//");
		colors = ["#BB2233"];
		presets.push(new Preset(4, 10, 20, 90, "A", rules, colors));
		
		rules = new Rules();
		rules.addSimpleRule('P', "I+[P+r]--//[--l]I[++l]-[Pr]++Pr");
		rules.addSimpleRule('p', "FF");
		rules.addSimpleRule('r', "[&&&p'/w////w////w////w////w]");
		rules.addSimpleRule('s', "sFs");
		rules.addSimpleRule('w', "['^F][{&&&&-f+f|-f+f}]");
		rules.addSimpleRule('I', "Fs[//&&l][//^^l]Fs");
		rules.addSimpleRule('l', "['{+f-ff-f+|+f-ff-f}]");
		colors = ["#886622", "#227722", "#DD0000"];
		presets.push(new Preset(5, 7, 20, 22.5, "P", rules, colors));

		rules = new Rules();
		rules.addSimpleRule('A', "[&FL!A]/////[&FL!A]///////[&FL!A]");
		rules.addSimpleRule('F', "S/////F");
		rules.addSimpleRule('S', "FL");
		rules.addSimpleRule('L', "['∧∧{-f+f+f-|-f+f+f}]");
		colors = ["#886622", "#227722"];
		presets.push(new Preset(7, 7, 35, 22.5, "A", rules, colors));

		return presets;
	}

}

