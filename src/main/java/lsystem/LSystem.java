package lsystem;

public abstract class AbstractLSystem implements LSystem {

    private String _axiom;
    private Rules _rules;

    public AbstractLSystem(String axiom, Rules rules) {
        _axiom = axiom;
    }

    @Override
    public String computeGeneration(int generation) {

    }

}
