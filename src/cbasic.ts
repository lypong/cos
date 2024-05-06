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
  listLines(){
    this.generateOrderedLines();
    this.OrderedLines?.forEach((l)=>bPrint(l.source));
  }
  generateOrderedLines(){
    this.OrderedLines = Object.values(this.lines);
    this.OrderedLines.sort((a,b)=>a.lineNumber-b.lineNumber);
  }
  partialReset() {
    this.vars = {};
    this.goSubStack = [];
    this.forStack = [];
    this.instructionPointer = 0;
    this.ended = false;
  }
  crash(errorMessage: string) {
    if(this.OrderedLines===undefined||this.OrderedLines[this.instructionPointer]===undefined)
      bPrint(errorMessage);
    else
      bPrint(`${errorMessage} line : ${this.OrderedLines[this.instructionPointer-1].source}`);
    this.ended = true;
  }
  writeLine(source: string) : boolean {
    let tokens = new Lexer(source).lex();
    let parser = new Parser(tokens);
    let lineNumber = parser.peek();
    if(lineNumber?.type!==TokenType.integer) {
      this.crash("No line number was provided. Please provide one.");
      return false;
    }
    this.lines[lineNumber.lexeme] = new Line(source,tokens,lineNumber.literal as number);
    return true;
  }
  goTo(lineNumber: number) : boolean {
    let low = 0;
    if(this.OrderedLines===undefined) {
      this.crash("BUG: Lines are not sorted out");
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
    this.generateOrderedLines();
    if(this.OrderedLines===undefined) {
      this.crash("BUG: Lines are not sorted out");
      return false;
    }
    while(this.instructionPointer<this.OrderedLines.length&&!this.ended){
      this.runStatement(this.OrderedLines[this.instructionPointer++].tokens);
    }
    this.partialReset();
  }
  runStatement(tokens: Token[]) : boolean{
    let parser = new Parser(tokens);
    let lineNumber = parser.consume();
    if((lineNumber as any).type!==TokenType.integer) {
      if(lineNumber===null)
        this.crash("Wanted line number but tokens are empty");
      else
        this.crash(`Expected line number got ${lineNumber.lexeme}`);
      return false;
    }
    let expr,evaluation,variableName;
    let goSub = false;
    let keyword = parser.consume();
    if(keyword===null){
      this.crash("Wanted keyword but tokens are empty");
      return false;
    }
    switch(keyword.lexeme) {
      case "LET":
        variableName = parser.consume();
        if((variableName as any).type!==TokenType.word){
          if(variableName===null)
            this.crash("Wanted variable name but tokens are empty");
          else
            this.crash(`Expected identifier got ${variableName.lexeme}`);
          return false;
        }
        if(keywords.includes((variableName as Token).lexeme)) {
          this.crash(`Expected variable name name got keyword instead : ${(variableName as Token).lexeme}`);
          return false;
        }
        if(!parser.matchAndConsume(TokenType.equal)){
          this.crash("Expected = after variable name");
          return false;
        }
        expr = parser.expr();
        if(expr===null){
          this.crash("Failed to create tree for expression");
          return false;
        }
        evaluation = expr.evaluate(this.vars);
        if(evaluation===null) {
          this.crash("Could not evaluate expression");
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
          this.crash("Failed to create tree for expression");
          return false;
        }
        evaluation = expr.evaluate(this.vars);
        if(evaluation===null) {
          this.crash("Could not evaluate expression");
          return false;
        }
        if(!parser.atEnd()) {
          this.crash("Invalid expression");
          return false;
        }  
        bPrint(`${literal}${evaluation}`);
        break;
      case "END":
        if(!parser.atEnd()) {
          this.crash("There shall be nothing after END");
          return false;
        }
        break;
      case "RETURN":
        let pop = this.goSubStack.pop();
        if(pop===undefined) {
          this.crash("Could not return because return stack is empty");
          return false;
        }
        if(!parser.atEnd()) {
          this.crash("There shall be nothing after RETURN");
          return false;
        }
        this.goTo(pop);
        break;
      case "GOSUB":
        if(this.OrderedLines===undefined) {
          this.crash("BUG: Lines are not sorted out");
          return false;
        }
        goSub = true;
      case "GOTO":
        lineNumber = parser.consume();
        if(lineNumber?.type!==TokenType.integer) {
          this.crash("Expected line number after GOTO");
          return false;
        }
        if(!parser.atEnd()) {
          this.crash("There shall be nothing after line number");
          return false;
        }
        if(goSub)
          this.goSubStack.push((this.OrderedLines as Line[])[this.instructionPointer].lineNumber);
        this.goTo((lineNumber as Token).literal as number);
        break;
      case "IF":
        expr = parser.expr();
        if(expr===null){
          this.crash("Failed to create tree for expression");
          return false;
        }
        evaluation = expr.evaluate(this.vars);
        if(evaluation===null) {
          this.crash("Could not evaluate expression");
          return false;
        }
        let relational = parser.consume();
        let exprRhs = parser.expr();
        if(exprRhs===null){
          this.crash("Failed to create tree for expression");
          return false;
        }
        let evaluationRhs = exprRhs.evaluate(this.vars);
        if(evaluationRhs===null) {
          this.crash("Could not evaluate expression");
          return false;
        }
        let thenKeyword = parser.consume();
        if(thenKeyword?.lexeme!=="THEN"){
          if(thenKeyword?.lexeme===null)
            this.crash("Expected THEN after comparison");
          else
            this.crash(`Expected THEN after comparison got ${thenKeyword?.lexeme}`);
          return false;
        }
        lineNumber = parser.consume();
        if(lineNumber?.type!==TokenType.integer) {
          if(lineNumber?.lexeme===null)
            this.crash("Expected line number after THEN");
          else
            this.crash(`Expected line number after THEN got ${lineNumber?.lexeme}`);
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
            this.crash(`Expected relational got ${relational?.asString}`);
        }
        if(!parser.atEnd()) {
          this.crash("There shall be nothing after line number");
          return false;
        }
        if(ok)
          this.goTo(lineNumber.literal as number);
        break;
      case "FOR":
        variableName = parser.consume();
        if((variableName as any).type!==TokenType.word){
          if(variableName===null)
            this.crash("Expected variable name");
          else
            this.crash(`Expected variable name got ${variableName.lexeme}`);
          return false;
        }
        if(keywords.includes((variableName as Token).lexeme)) {
          this.crash(`Expected variable name got keyword ${(variableName as Token).lexeme}`);
          return false;
        }
        if(!parser.matchAndConsume(TokenType.equal)){
          this.crash("Expected = after variable name");
          return false;
        }
        expr = parser.expr();
        if(expr===null){
          this.crash("Failed to create tree for expression");
          return false;
        }
        evaluation = expr.evaluate(this.vars);
        if(evaluation===null) {
          this.crash("Could not evaluate expression");
          return false;
        }
        let toKeyword = parser.consume();
        if(toKeyword?.lexeme!=="TO") {
          if(toKeyword===null)
            this.crash("Expected keyword TO");
          else
            this.crash(`Expected keyword TO got ${toKeyword.lexeme}`);
          return false;
        }
        let toExpr = parser.expr();
        if(toExpr===null) {
          this.crash("Failed to create tree for expression after TO");
          return false;
        }
        let toEvaluation = toExpr.evaluate(this.vars);
        if(toEvaluation===null) {
          this.crash("Could not evaluate expression after TO");
          return false;
        }   
        let stepKeyword = parser.peek();
        let stepEvaluation = 1;
        if(stepKeyword?.lexeme === "STEP"){
          parser.consume();
          let stepExpr = parser.expr();
          if(stepExpr===null) {
            this.crash("Failed to create tree for expression after STEP");
            return false;
          }
          let e = stepExpr.evaluate(this.vars);
          if(e===null) {
            this.crash("Could not evaluate expression after STEP");
            return false;
          }
          stepEvaluation = e;
        }
        if(!parser.atEnd()) {
          this.crash("Invalid expression");
          return false;
        }
        if(this.OrderedLines===undefined) {
          this.crash("BUG: Lines are not sorted out");
          return false;
        }
        this.vars[(variableName as Token).lexeme] = evaluation;
        if((stepEvaluation>0&&evaluation>toEvaluation)||(stepEvaluation<0&&evaluation<toEvaluation)) {
          while(this.OrderedLines[++this.instructionPointer]?.tokens[1]?.lexeme!=="NEXT"||this.OrderedLines[this.instructionPointer]?.tokens[2]?.lexeme!==(variableName as Token).lexeme)
            if(this.instructionPointer>=this.OrderedLines.length){
              this.crash("No corresponding NEXT statement found");
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
            this.crash("Expected variable name");
          else
            this.crash(`Expected variable name got ${variableName.lexeme}`);
          return false;
        }
        if(keywords.includes((variableName as Token).lexeme)) {
          this.crash(`Expected variable name got keyword ${(variableName as Token).lexeme}`);
          return false;
        }
        let topOfStack = this.forStack[this.forStack.length-1];
        if(topOfStack?.variableName !== (variableName as Token).lexeme){
          if(topOfStack?.variableName===undefined)
            this.crash("No opened FOR statement")
          else
            this.crash(`NEXT statement does not match with FOR ${topOfStack?.variableName}<>${(variableName as Token).lexeme}`);
          return false;
        }
        if(!parser.atEnd()) {
          this.crash("There shall be nothing after variable name");
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
        this.crash(`Expected keyword got ${keyword}`);
        return false;
    }
    if(!parser.atEnd()) {
      this.crash("BUG: Tokens weren't entirely consumed.");
      return false;
    }
    return true;
  }
}