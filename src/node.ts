type Operator = "getVar" |
 "callFunc" |
 TokenType.plus |
 TokenType.minus |
 TokenType.mult |
 TokenType.div |
 TokenType.exp;
const builtins : {[x:string]:(param:number)=>number} = {
  "INT" : Math.trunc,
  "RND" : Math.random,
  "SIN" : Math.sin,
  "COS" : Math.cos,
  "TAN" : Math.tan,
  "ATN" : Math.atan,
  "EXP" : Math.exp,
  "ABS" : Math.abs,
  "LOG" : (n)=>Math.log(Math.abs(n)),
  "SQR" : (n)=>Math.sqrt(Math.abs(n)),
}
class BNode{
  operator : Operator;
  lhs : BNode|number|string;
  rhs? : BNode|number;
  constructor(operator: Operator,lhs: BNode|number|string,rhs?: BNode|number){
    this.operator = operator;
    this.lhs = lhs;
    this.rhs = rhs;
  }
  evaluate(vars:{[x:string]:number}): number|null{
    let evaluatedLhs : number;
    let evaluatedRhs : number;
    if(this.operator==="callFunc"){
      let f = builtins[this.lhs as string];
      if(f===undefined)
        return null;
      let evaluated = (this.rhs as BNode).evaluate(vars);
      if(evaluated===null)
        return null;
      return f(evaluated);
    }
    if((this.lhs as any).evaluate===undefined)
      evaluatedLhs = this.lhs as number;
    else {
      let evaluated = (this.lhs as BNode).evaluate(vars);
      if(evaluated===null)
        return null;
      evaluatedLhs = evaluated;
    }
    // rhs can be undefined with operator nodeGetVar;
    if(this.operator === "getVar")
      return vars[this.lhs as string] ?? 0;
    if((this.rhs as any).evaluate===undefined)
      evaluatedRhs = this.rhs as number;
    else {
      let evaluated = (this.rhs as BNode).evaluate(vars);
      if(evaluated===null)
        return null;
      evaluatedRhs = evaluated;
    }
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
