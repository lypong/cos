const nodeGetVar = "getVar";
class BNode{
  constructor(operator,lhs,rhs){
    this.operator = operator;
    this.lhs = lhs;
    this.rhs = rhs;
  }
  evaluate(vars){
    let evaluatedLhs;
    let evaluatedRhs;
    if(this.lhs.evaluate===undefined)
      evaluatedLhs = this.lhs;
    else
      evaluatedLhs = this.lhs.evaluate(vars);

    // rhs can be undefined with operator nodeGetVar;
    if(this.operator === nodeGetVar)
      return vars[this.lhs] ?? 0;
    if(this.rhs.evaluate===undefined)
      evaluatedRhs = this.rhs;
    else
      evaluatedRhs = this.rhs.evaluate(vars);
    switch(this.operator) {
      case TokenType.plus:
        return evaluatedLhs+evaluatedRhs;
      case TokenType.minus:
        return evaluatedLhs-evaluatedRhs;
      case TokenType.mult:
        return evaluatedLhs*evaluatedRhs;
      case TokenType.div:
        return evaluatedLhs/evaluatedRhs;
      case TokenType.exp:
        return evaluatedLhs**evaluatedRhs;
    }
  }
}
