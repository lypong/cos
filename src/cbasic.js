class Line {
  constructor(source,tokens,lineNumber){
    this.source = source;
    this.tokens = tokens;
    this.lineNumber = lineNumber;
  }
}
class For {
  constructor(start,variableName,to,step){
    this.start = start;
    this.variableName = variableName;
    this.to = to;
    this.step = step;
  }
}
class Program {
  constructor() {
    this.vars = {};
    this.lines = {};
    this.goSubStack = [];
    this.forStack = [];
    this.instructionPointer = 0;
    this.ended = false;
  }
  writeLine(source) {
    let tokens = lex(source);
    let parser = new Parser(tokens);
    let lineNumber = parser.peek();
    if(lineNumber?.type!==TokenType.integer) {
      console.log("No line number was provided. Please provide one.");
      return false;
    }
    this.lines[lineNumber.lexeme] = new Line(source,tokens,lineNumber.literal);
    return true;
  }
  goTo(lineNumber) {
    let low = 0;
    let high = this.OrderedLines.length;
    let mid = low+Math.floor((high-low)/2);
    while(this.OrderedLines[mid].lineNumber!==lineNumber){
      if(high-1<=low) {
        this.instructionPointer=mid;
        if(this.OrderedLines[mid].lineNumber<lineNumber)
          this.instructionPointer++;
        return;
      }
      if(this.OrderedLines[mid].lineNumber<lineNumber)
        low = mid;
      else
        high = mid;
      mid = low+Math.floor((high-low)/2);
    }
    this.instructionPointer=mid;
  }
  runProgram() {
    this.OrderedLines = Object.values(this.lines);
    this.OrderedLines.sort((a,b)=>a.lineNumber-b.lineNumber);
    while(this.instructionPointer<this.OrderedLines.length&&!this.ended){
      this.runStatement(this.OrderedLines[this.instructionPointer++].tokens);
    }
  }
  runStatement(tokens) {
    let parser = new Parser(tokens);
    let lineNumber = parser.consume();
    if(lineNumber.type!=TokenType.integer) {
      console.log(`Expected line number got ${lineNumber.asString()}`);
      return;
    }
    let expr,evaluation,variableName;
    let keyword = parser.consume(); 
    switch(keyword.lexeme) {
      case "LET":
        variableName = parser.consume();
        if(variableName.type!==TokenType.word){
          console.log(`Expected identifier got ${variableName.asString()}`);
          return;
        }
        if(keywords.includes(variableName.lexeme)) {
          console.log(`Expected var name got keyword instead : ${variableName.asString()}`);
          return;
        }
        if(!parser.matchAndConsume(TokenType.equal)){
          console.log(`Expected = after var name.`);
          return;
        }
        expr = parser.expr();
        evaluation = expr.evaluate(this.vars);
        if(evaluation===null) {
          console.log(`Could not evaluate expression.`)
          return;
        }
        this.vars[variableName.lexeme] = evaluation;
        break;
      case "PRINT":
        let label = parser.peek();
        if(label?.type===TokenType.label){
          parser.consume();
          label = label.literal;
        } else {
          label = "";
        }
        if(parser.atEnd()){
          bPrint(label);
          break;
        }
        expr = parser.expr();
        if(expr===null) {
          console.log(`Invalid expression`);
          return;
        }       
        evaluation = expr.evaluate(this.vars);
        if(evaluation===null) {
          console.log(`Could not evaluate expression.`)
          return;
        }       
        bPrint(`${label}${evaluation}`);
        break;
      case "END":
        this.ended = true;
        break;
      case "RETURN":
        this.goTo(this.goSubStack.pop());
        break;
      case "GOSUB":
        this.goSubStack.push(this.OrderedLines[this.instructionPointer].lineNumber);
      case "GOTO":
        lineNumber = parser.consume();
        if(lineNumber?.type!==TokenType.integer) {
          console.log("Expected line number after GOTO");
          return;
        }
        this.goTo(lineNumber.literal);
        break;
      case "IF":
        evaluation = parser.expr().evaluate(this.vars);
        let relational = parser.consume();
        let evaluationRhs = parser.expr().evaluate(this.vars);
        let thenKeyword = parser.consume();
        if(thenKeyword?.lexeme!=="THEN"){
          console.log("Expected THEN after comparison.");
          return;
        }
        lineNumber = parser.consume();
        if(lineNumber?.type!==TokenType.integer) {
          console.log("Expected line number after GOTO");
          return;
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
        if(ok)
          this.goTo(lineNumber.literal);
        break;
      case "FOR": //TODO CHECK FOR NULL
        variableName = parser.consume();
        if(variableName.type!==TokenType.word){
          console.log(`Expected identifier got ${variableName.asString()}`);
          return;
        }
        if(keywords.includes(variableName.lexeme)) {
          console.log(`Expected var name got keyword instead : ${variableName.asString()}`);
          return;
        }
        if(!parser.matchAndConsume(TokenType.equal)){
          console.log(`Expected = after var name.`);
          return;
        }
        expr = parser.expr();
        evaluation = expr.evaluate(this.vars);
        if(evaluation===null) {
          console.log(`Could not evaluate expression.`)
          return;
        }
        let toKeyword = parser.consume();
        if(toKeyword?.lexeme!=="TO") {
          console.log(`Expected keyword TO got ${toKeyword.lexeme}`);
          return;
        }
        let toExpr = parser.expr();
        let toEvaluation = toExpr.evaluate(this.args);
        let stepKeyword = parser.peek();
        let stepEvaluation = 1;
        if(stepKeyword?.lexeme === "STEP"){
          parser.consume();
          let stepExpr = parser.expr();
          stepEvaluation = stepExpr.evaluate(this.args);
        }
        this.vars[variableName.lexeme] = evaluation;
        if((stepEvaluation>0&&evaluation>toEvaluation)||(stepEvaluation<0&&evaluation<toEvaluation)) {
          while(this.OrderedLines[++this.instructionPointer]?.tokens[1]?.lexeme!=="NEXT"||this.OrderedLines[this.instructionPointer]?.tokens[2]?.lexeme!==variableName.lexeme)
            if(this.instructionPointer>=this.OrderedLines.length){
              console.log("No corresponding NEXT statement found");
              return;
            }
          this.instructionPointer++; //skips next
        } else
          this.forStack.push(new For(this.instructionPointer,variableName.lexeme,toEvaluation,stepEvaluation));
        break;
      case "NEXT":
        variableName = parser.consume();
        if(variableName.type!==TokenType.word){
          console.log(`Expected identifier got ${variableName.asString()}`);
          return;
        }
        if(keywords.includes(variableName.lexeme)) {
          console.log(`Expected var name got keyword instead : ${variableName.asString()}`);
          return;
        }
        let topOfStack = this.forStack[this.forStack.length-1];
        if(topOfStack?.variableName !== variableName.lexeme){
          console.log(`NEXT statement does not match with FOR ${topOfStack?.variableName}<>${variableName.lexeme}`);
          return;
        }
        this.vars[variableName.lexeme] += topOfStack.step;
        if(topOfStack.step>0) {
          if(this.vars[variableName.lexeme]>topOfStack.to)
            this.forStack.pop();
          else
            this.instructionPointer = topOfStack.start;
        } else {
          if(this.vars[variableName.lexeme]<topOfStack.to)
            this.forStack.pop();
          else
            this.instructionPointer = topOfStack.start;
        }
        break;
      case "REM":
        return;
      default:
        console.log(`Expected keyword got ${keyword}`);
        return;
    }
    if(!parser.atEnd()) //TODO DELETE
      console.log(`Tokens weren't entirely consumed.`);
  }
}

function lex(code){
  let tokens = [];
  let lexer = new Lexer(code);
  while(!lexer.atEnd()) {
    let c = lexer.consume();
    switch(c) {
      case '<':
        if(lexer.matchAndConsume('='))
          tokens.push(new Token(TokenType.lessOrEqual,"<="));
        else if(lexer.matchAndConsume('>'))
          tokens.push(new Token(TokenType.notEqual,"<>"));
        else
          tokens.push(new Token(TokenType.less,'<'));
        break;
      case '>':
        if(lexer.matchAndConsume('='))
          tokens.push(new Token(TokenType.greaterOrEqual,">="));
        else
          tokens.push(new Token(TokenType.greater,'>'));
        break;
      case ' ':
      case '\t':
      case '\r':
        break;
      case '0':
        tokens.push(new Token(TokenType.integer,'0',0));
        break;
      case '"':
        tokens.push(lexer.label());
        break;
      default:
        if(singleCharacterTokens[c]!==undefined)
          tokens.push(new Token(singleCharacterTokens[c],c));
        else if(isLetter(c))
          tokens.push(lexer.word());
        else if(isDigit(c)&&c!='0')
          tokens.push(lexer.integer());
        else
          console.log(`Char ${c} can't be tokenized.`)
        break;
    }
  }
  return tokens;
}