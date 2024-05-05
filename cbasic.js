const keywords = ["LET","PRINT","REM","END","GOTO","IF","THEN","GOSUB","RETURN","FOR","TO","STEP","NEXT"];
const TokenType = {
  integer : "integer",
  label : "label",
  word : "word",
  less : "less",
  lessOrEqual : "lessOrEqual",
  greater : "greater",
  greaterOrEqual : "greaterOrEqual",
  notEqual : "notEqual",
  equal : "equal",
  plus : "plus",
  minus : "minus",    
  mult : "mult",
  div : "div",
  exp : "exp",
  openParen : "openParen",
  closeParen : "closeParen",
}
const nodeGetVar = "getVar";
const singleCharacterTokens = {
  '=' : TokenType.equal,
  '+' : TokenType.plus,
  '-' : TokenType.minus,
  '*' : TokenType.mult,
  '/' : TokenType.div,
  '?' : TokenType.exp,
  '(' : TokenType.openParen,
  ')' : TokenType.closeParen,
}
class Token {
  constructor(type,lexeme,literal) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
  }
  asString() {
    return `Token { type : ${this.type}, lexeme : ${this.lexeme}, literal : ${this.literal}}`;
  }
}
class Lexer {
  constructor(code) {
    this.code = code;
    this.position = 0;
    this.lexedKeyword = false;
  }
  atEnd(offset) {
    if(offset === undefined)
      offset = 0;
    return this.position + offset >=this.code.length;
  }
  consume() {
    if (this.atEnd())
      return null;
    return this.code[this.position++];
  }
  peek(offset) {
    if(offset === undefined)
      offset = 0;
    if(this.atEnd(offset))
      return null;
    return this.code[this.position+offset];
  }
  matchAndConsume(c){
    if(this.peek()!==c)
      return false;
    this.consume();
    return true;
  }
  word(){
    let start = this.position-1;
    let peek = this.peek();
    let sub = this.code[start];
    while(isLetter(peek)||isDigit(peek)||peek==='_'){
      this.consume();
      sub = this.code.substring(start,this.position);
      if(!this.lexedKeyword&&keywords.includes(sub)){
        if(sub!=="IF"&&sub!=="FOR"&&sub!=="TO")
          this.lexedKeyword = true;
        return new Token(TokenType.word,sub);
      }
      peek = this.peek();
    }
    return new Token(TokenType.word,sub);
  }
  integer(){
    let start = this.position-1;
    let peek = this.peek();
    while(isDigit(peek)){
      this.consume();
      peek = this.peek();
    }
    let lexeme = this.code.substring(start,this.position);
    return new Token(TokenType.integer,lexeme,parseInt(lexeme));
  }
  label(){
    let start = this.position-1;
    let peek = this.peek();
    while(peek!=='"'&&!this.atEnd()){
      this.consume();
      peek = this.peek();
    }
    this.consume();
    let lexeme = this.code.substring(start,this.position);
    return new Token(TokenType.label,lexeme,lexeme.substr(1,lexeme.length-2));
  }
}
class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.position = 0;
  }
  atEnd(offset) {
    if(offset === undefined)
      offset = 0;
    return this.position + offset >=this.tokens.length;
  }
  consume() {
    if (this.atEnd())
      return null;
    return this.tokens[this.position++];
  }
  peek(offset) {
    if(offset === undefined)
      offset = 0;
    if(this.atEnd(offset))
      return null;
    return this.tokens[this.position+offset];
  }
  matchAndConsume(t) {
    if(this.peek()?.type!==t)
      return false;
    this.consume();
    return true;
  }
  //TODO support exponentiation.
  factor() {
    let peek = this.peek();
    let unaryMinus = this.matchAndConsume(TokenType.minus);
    if(unaryMinus) {
      let f = this.factor();
      if(f===null) {
        return null;
      }
      return new Node(TokenType.mult,-1,f);
    }
    switch(peek?.type) {
      case TokenType.openParen:
        this.consume();
        let e = this.expr();
        peek = this.peek();
        if(peek?.type!==TokenType.closeParen)
          return null;
        this.consume();
        return e;
      case TokenType.word:
        if(keywords.includes(peek.lexeme))
          return null;
        this.consume();
        return new Node(nodeGetVar,peek.lexeme);
      case TokenType.integer:
        this.consume();
        return new Node(TokenType.plus,0,peek.literal);
      default: return null;
    }
  }

  term() {
    let lhs = this.factor();
    let multOrDiv = this.peek();
    let n = new Node(TokenType.mult,lhs,1);
    while(multOrDiv?.type === TokenType.mult || multOrDiv?.type === TokenType.div) {
      this.consume();
      let f = this.factor();
      if(f===null)
        return null;
      n.rhs = new Node(multOrDiv.type,n.rhs,f);
      multOrDiv = this.peek();
    }
    return n;
  }

  expr() {
    let lhs;
    lhs = this.term(); 
    let n = new Node(TokenType.plus,lhs,0);
    let plusOrMinus = this.peek();
    while(plusOrMinus?.type === TokenType.plus || plusOrMinus?.type === TokenType.minus){
      this.consume();
      let t = this.term();
      if(t===null)
        return null;
      n.rhs = new Node(plusOrMinus.type,n.rhs,t);
      plusOrMinus = this.peek();
    }

    return n;
  }
}
class Node{
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
function isDigit(c) {
  if(c===null)
    return false;
  return c >= '0' && c <= '9';
}
function isLetter(c) {
  if(c===null)
    return false;
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
}
function isOperator(type) {
  switch(type){
      case TokenType.plus:
      case TokenType.minus:
      case TokenType.mult:
      case TokenType.div:
      case TokenType.exp:
        return true;
  }
  return false;
}
function bPrint(...args){
  console.log(...args);
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

console.log(lex("- + = <= <> <+ PRINTyak y12_a >= 1023 0"));
let t = lex("10LETpip=(1+2)*8");
let t2 = lex("20PRINT3");
let t3 = lex("30REMHELLOWORLD");
let p = new Program();
p.writeLine("10 FOR P=1 TO 10")
p.writeLine("15 FOR C=1 TO 10");
p.writeLine('20 PRINT "-C="-C-2*5');
p.writeLine("25 NEXT C");
p.writeLine("26 NEXT P");
p.writeLine("30 PRINT 1")
p.runProgram();
//console.log(lex("24GOTO11"));
