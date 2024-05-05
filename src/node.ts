type Operator = "getVar" |
 TokenType.plus |
 TokenType.minus |
 TokenType.mult |
 TokenType.div |
 TokenType.exp;
class BNode{
  operator : Operator;
  lhs : BNode|number|string;
  rhs? : BNode|number;
  constructor(operator,lhs: BNode|number|string,rhs?: BNode|number){
    this.operator = operator;
    this.lhs = lhs;
    this.rhs = rhs;
  }
  evaluate(vars:{[x:string]:number}): number{
    let evaluatedLhs : number;
    let evaluatedRhs : number;
    if((this.lhs as any).evaluate===undefined)
      evaluatedLhs = this.lhs as number;
    else
      evaluatedLhs = (this.lhs as BNode).evaluate(vars);

    // rhs can be undefined with operator nodeGetVar;
    if(this.operator === "getVar")
      return vars[this.lhs as string] ?? 0;
    if((this.rhs as any).evaluate===undefined)
      evaluatedRhs = this.rhs as number;
    else
      evaluatedRhs = (this.rhs as BNode).evaluate(vars);
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
