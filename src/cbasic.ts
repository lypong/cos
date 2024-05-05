class Line {
  source : string;
  tokens : Token[];
  lineNumber : number;
  constructor(source: string,tokens: Token[],lineNumber: number){
    this.source = source;
    this.tokens = tokens;
    this.lineNumber = lineNumber;
  }
}
class For {
  start : number;
  variableName : string;
  to : number;
  step : number;
  constructor(start: number,variableName: string,to: number,step: number){
    this.start = start;
    this.variableName = variableName;
    this.to = to;
    this.step = step;
  }
}
class Program {
  vars : {[x:string]:number};
  lines : {[x:string]:Line};
  goSubStack : number[];
  forStack : For[];
  instructionPointer : number;
  ended : boolean;
  OrderedLines? : Line[];
  constructor() {
    this.vars = {};
    this.lines = {};
    this.goSubStack = [];
    this.forStack = [];
    this.instructionPointer = 0;
    this.ended = false;
  }
  writeLine(source: string) : boolean {
    let tokens = new Lexer(source).lex();
    let parser = new Parser(tokens);
    let lineNumber = parser.peek();
    if(lineNumber?.type!==TokenType.integer) {
      console.log("No line number was provided. Please provide one.");
      return false;
    }
    this.lines[lineNumber.lexeme] = new Line(source,tokens,lineNumber.literal as number);
    return true;
  }
  goTo(lineNumber: number) : boolean {
    let low = 0;
    if(this.OrderedLines===undefined) {
      console.log("BUG: Lines are not sorted out");
      return false;
    }
    let high = this.OrderedLines.length;
    let mid = low+Math.floor((high-low)/2);
    while(this.OrderedLines[mid].lineNumber!==lineNumber){
      if(high-1<=low) {
        this.instructionPointer=mid;
        if(this.OrderedLines[mid].lineNumber<lineNumber)
          this.instructionPointer++;
        return true;
      }
      if(this.OrderedLines[mid].lineNumber<lineNumber)
        low = mid;
      else
        high = mid;
      mid = low+Math.floor((high-low)/2);
    }
    this.instructionPointer=mid;
    return true;
  }
  runProgram() {
    this.OrderedLines = Object.values(this.lines);
    this.OrderedLines.sort((a,b)=>a.lineNumber-b.lineNumber);
    while(this.instructionPointer<this.OrderedLines.length&&!this.ended){
      this.runStatement(this.OrderedLines[this.instructionPointer++].tokens);
    }
  }
  runStatement(tokens: Token[]) : boolean{
    let parser = new Parser(tokens);
    let lineNumber = parser.consume();
    if((lineNumber as any).type!==TokenType.integer) {
      if(lineNumber===null)
        console.log("Wanted line number but tokens are empty");
      else
        console.log(`Expected line number got ${lineNumber.lexeme}`);
      return false;
    }
    let expr,evaluation,variableName;
    let goSub = false;
    let keyword = parser.consume();
    if(keyword===null){
      console.log("Wanted keyword but tokens are empty");
      return false;
    }
    switch(keyword.lexeme) {
      case "LET":
        variableName = parser.consume();
        if((variableName as any).type!==TokenType.word){
          if(variableName===null)
            console.log("Wanted variable name but tokens are empty");
          else
            console.log(`Expected identifier got ${variableName.lexeme}`);
          return false;
        }
        if(keywords.includes((variableName as Token).lexeme)) {
          console.log(`Expected variable name name got keyword instead : ${(variableName as Token).lexeme}`);
          return false;
        }
        if(!parser.matchAndConsume(TokenType.equal)){
          console.log("Expected = after variable name");
          return false;
        }
        expr = parser.expr();
        if(expr===null){
          console.log("Failed to create tree for expression");
          return false;
        }
        evaluation = expr.evaluate(this.vars);
        if(evaluation===null) {
          console.log("Could not evaluate expression");
          return false;
        }
        this.vars[(variableName as Token).lexeme] = evaluation;
        break;
      case "PRINT":
        let label = parser.peek();
        let literal = "";
        if(label?.type===TokenType.label){
          parser.consume();
          literal = label.literal as string;
        }
        if(parser.atEnd()){
          bPrint(literal);
          break;
        }
        expr = parser.expr();
        if(expr===null){
          console.log("Failed to create tree for expression");
          return false;
        }
        evaluation = expr.evaluate(this.vars);
        if(evaluation===null) {
          console.log("Could not evaluate expression");
          return false;
        }
        if(!parser.atEnd()) {
          console.log("Invalid expression");
          this.ended = true;
          return false;
        }  
        bPrint(`${literal}${evaluation}`);
        break;
      case "END":
        if(!parser.atEnd()) {
          console.log("There shall be nothing after END");
          this.ended = true;
          return false;
        }
        this.ended = true;
        break;
      case "RETURN":
        let pop = this.goSubStack.pop();
        if(pop===undefined) {
          console.log("Could not return because return stack is empty");
          return false;
        }
        if(!parser.atEnd()) {
          console.log("There shall be nothing after RETURN");
          this.ended = true;
          return false;
        }
        this.goTo(pop);
        break;
      case "GOSUB":
        if(this.OrderedLines===undefined) {
          console.log("BUG: Lines are not sorted out");
          return false;
        }
        goSub = true;
      case "GOTO":
        lineNumber = parser.consume();
        if(lineNumber?.type!==TokenType.integer) {
          console.log("Expected line number after GOTO");
          return false;
        }
        if(!parser.atEnd()) {
          console.log("There shall be nothing after line number");
          this.ended = true;
          return false;
        }
        if(goSub)
          this.goSubStack.push((this.OrderedLines as Line[])[this.instructionPointer].lineNumber);
        this.goTo((lineNumber as Token).literal as number);
        break;
      case "IF":
        expr = parser.expr();
        if(expr===null){
          console.log("Failed to create tree for expression");
          return false;
        }
        evaluation = expr.evaluate(this.vars);
        if(evaluation===null) {
          console.log("Could not evaluate expression");
          return false;
        }
        let relational = parser.consume();
        let exprRhs = parser.expr();
        if(exprRhs===null){
          console.log("Failed to create tree for expression");
          return false;
        }
        let evaluationRhs = exprRhs.evaluate(this.vars);
        if(evaluationRhs===null) {
          console.log("Could not evaluate expression");
          return false;
        }
        let thenKeyword = parser.consume();
        if(thenKeyword?.lexeme!=="THEN"){
          if(thenKeyword?.lexeme===null)
            console.log("Expected THEN after comparison");
          else
            console.log(`Expected THEN after comparison got ${thenKeyword?.lexeme}`);
          return false;
        }
        lineNumber = parser.consume();
        if(lineNumber?.type!==TokenType.integer) {
          if(lineNumber?.lexeme===null)
            console.log("Expected line number after THEN");
          else
            console.log(`Expected line number after THEN got ${lineNumber?.lexeme}`);
          return false;
        }
        let ok;
        switch(relational?.type){
          case TokenType.less:
            ok = evaluation<evaluationRhs
            break;
          case TokenType.greater:
            ok = evaluation>evaluationRhs;
            break;
          case TokenType.lessOrEqual:
            ok = evaluation<=evaluationRhs;
            break;
          case TokenType.greaterOrEqual:
            ok = evaluation>=evaluationRhs;
            break;
          case TokenType.equal:
            ok = evaluation===evaluationRhs;
            break;
          case TokenType.notEqual:
            ok = evaluation!==evaluationRhs;
            break;
          default:
            console.log(`Expected relational got ${relational?.asString}`);
        }
        if(!parser.atEnd()) {
          console.log("There shall be nothing after line number");
          this.ended = true;
          return false;
        }
        if(ok)
          this.goTo(lineNumber.literal as number);
        break;
      case "FOR":
        variableName = parser.consume();
        if((variableName as any).type!==TokenType.word){
          if(variableName===null)
            console.log("Expected variable name");
          else
            console.log(`Expected variable name got ${variableName.lexeme}`);
          return false;
        }
        if(keywords.includes((variableName as Token).lexeme)) {
          console.log(`Expected variable name got keyword ${(variableName as Token).lexeme}`);
          return false;
        }
        if(!parser.matchAndConsume(TokenType.equal)){
          console.log("Expected = after variable name");
          return false;
        }
        expr = parser.expr();
        if(expr===null){
          console.log("Failed to create tree for expression");
          return false;
        }
        evaluation = expr.evaluate(this.vars);
        if(evaluation===null) {
          console.log("Could not evaluate expression");
          return false;
        }
        let toKeyword = parser.consume();
        if(toKeyword?.lexeme!=="TO") {
          if(toKeyword===null)
            console.log("Expected keyword TO");
          else
            console.log(`Expected keyword TO got ${toKeyword.lexeme}`);
          return false;
        }
        let toExpr = parser.expr();
        if(toExpr===null) {
          console.log("Failed to create tree for expression after TO");
          return false;
        }
        let toEvaluation = toExpr.evaluate(this.vars);
        if(toEvaluation===null) {
          console.log("Could not evaluate expression after TO");
          return false;
        }   
        let stepKeyword = parser.peek();
        let stepEvaluation = 1;
        if(stepKeyword?.lexeme === "STEP"){
          parser.consume();
          let stepExpr = parser.expr();
          if(stepExpr===null) {
            console.log("Failed to create tree for expression after STEP");
            return false;
          }
          let e = stepExpr.evaluate(this.vars);
          if(e===null) {
            console.log("Could not evaluate expression after STEP");
            return false;
          }
          stepEvaluation = e;
        }
        if(!parser.atEnd()) {
          console.log("Invalid expression");
          this.ended = true;
          return false;
        }
        if(this.OrderedLines===undefined) {
          console.log("BUG: Lines are not sorted out");
          return false;
        }
        this.vars[(variableName as Token).lexeme] = evaluation;
        if((stepEvaluation>0&&evaluation>toEvaluation)||(stepEvaluation<0&&evaluation<toEvaluation)) {
          while(this.OrderedLines[++this.instructionPointer]?.tokens[1]?.lexeme!=="NEXT"||this.OrderedLines[this.instructionPointer]?.tokens[2]?.lexeme!==(variableName as Token).lexeme)
            if(this.instructionPointer>=this.OrderedLines.length){
              console.log("No corresponding NEXT statement found");
              return false;
            }
          this.instructionPointer++; //skips next
        } else
          this.forStack.push(new For(this.instructionPointer,(variableName as Token).lexeme,toEvaluation,stepEvaluation));
        break;
      case "NEXT":
        variableName = parser.consume();
        if((variableName as any).type!==TokenType.word){
          if(variableName===null)
            console.log("Expected variable name");
          else
            console.log(`Expected variable name got ${variableName.lexeme}`);
          return false;
        }
        if(keywords.includes((variableName as Token).lexeme)) {
          console.log(`Expected variable name got keyword ${(variableName as Token).lexeme}`);
          return false;
        }
        let topOfStack = this.forStack[this.forStack.length-1];
        if(topOfStack?.variableName !== (variableName as Token).lexeme){
          if(topOfStack?.variableName===undefined)
            console.log("No opened FOR statement")
          else
            console.log(`NEXT statement does not match with FOR ${topOfStack?.variableName}<>${(variableName as Token).lexeme}`);
          return false;
        }
        if(!parser.atEnd()) {
          console.log("There shall be nothing after variable name");
          this.ended = true;
          return false;
        }
        this.vars[(variableName as Token).lexeme] += topOfStack.step;
        if(topOfStack.step>0) {
          if(this.vars[(variableName as Token).lexeme]>topOfStack.to)
            this.forStack.pop();
          else
            this.instructionPointer = topOfStack.start;
        } else {
          if(this.vars[(variableName as Token).lexeme]<topOfStack.to)
            this.forStack.pop();
          else
            this.instructionPointer = topOfStack.start;
        }
        break;
      case "REM":
        return true;
      default:
        console.log(`Expected keyword got ${keyword}`);
        return false;
    }
    if(!parser.atEnd()) {
      console.log("BUG: Tokens weren't entirely consumed.");
      this.ended = true;
      return false;
    }
    return true;
  }
}