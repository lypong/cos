const keywords = ["LET","PRINT","REM","END","GOTO"];
const TokenType = {
  integer : "integer",
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
  word(c){
    let start = this.position-1;
    let peek = this.peek();
    while(isLetter(peek)||isDigit(peek)||peek==='_'){
      this.consume();
      if(!this.lexedKeyword&&keywords.includes(this.code.substring(start,this.position))){
        this.lexedKeyword = true;
        return new Token(TokenType.word,this.code.substring(start,this.position));
      }
      peek = this.peek();
    }
    return new Token(TokenType.word,this.code.substring(start,this.position));
  }
  integer(c){
    let start = this.position-1;
    let peek = this.peek();
    while(isDigit(peek)){
      this.consume();
      peek = this.peek();
    }
    let lexeme = this.code.substring(start,this.position);
    return new Token(TokenType.integer,lexeme,parseInt(lexeme));
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
  //TODO support exponentiation
  factor() {
    let peek = this.peek();
    if (peek?.type===TokenType.openParen) {
      this.consume();
      let e = this.expr();
      peek = this.peek();
      if(peek?.type!==TokenType.closeParen)
        return null;
      this.consume();
      return e;
    }
    if(peek?.type!==TokenType.integer)
      return null;
    this.consume();
    return new Node(TokenType.plus,0,peek.literal);
  }

  term() {
    let lhs = this.factor();
    let multOrDiv = this.peek();
    let n = lhs;
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
    let unaryMinus = this.peek();
    let lhs;
    // TODO add support for unary operator '-'
    /*if(unaryMinus?.type===TokenType.minus) {
      this.consume();
      lhs = new Node(TokenType.minus,0,this.term());
    }
    else*/
    lhs = this.term(); 
    let n = lhs;
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
  evaluate(){
    let evaluatedLhs;
    let evaluatedRhs;
    if(this.lhs.evaluate===undefined)
      evaluatedLhs = this.lhs;
    else
      evaluatedLhs = this.lhs.evaluate();

    if(this.rhs.evaluate===undefined)
      evaluatedRhs = this.rhs;
    else
      evaluatedRhs = this.rhs.evaluate();
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
class Program {
  constructor() {
    this.vars = {};
    this.lines = {};
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
    //TODO binary search. If line number not found, goto the nearest after
    let low = 0;
    let high = this.OrderedLines.length;
    let mid = low+Math.floor((high-low)/2);
    while(this.OrderedLines[mid].lineNumber!==lineNumber){
      if(high-1<=low) {
        this.instructionPointer=mid+1;
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
    let expr,evaluation;
    let keyword = parser.consume(); 
    switch(keyword.lexeme) {
      case "LET":
        let variableName = parser.consume();
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
        evaluation = expr.evaluate()
        if(evaluation===null) {
          console.log(`Could not evaluate expression.`)
          return;
        }
        this.vars[variableName.lexeme] = evaluation;
        break;
      case "PRINT":
        expr = parser.expr();
        evaluation = expr.evaluate()
        if(evaluation===null) {
          console.log(`Could not evaluate expression.`)
          return;
        }       
        bPrint(evaluation);
        break;
      case "END":
        this.ended = true;
        break;
      case "GOTO":
        let lineNumber = parser.consume();
        if(lineNumber?.type!==TokenType.integer) {
          console.log("Expected line number after GOTO");
          return;
        }
        this.goTo(lineNumber.literal);
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
p.writeLine("30REMHELLOWORLD");
p.writeLine("20PRINT2");
p.writeLine("10PRINT1");
p.writeLine("30PRINT3");
p.writeLine("25END");
p.writeLine("24GOTO10");
p.runProgram();
//console.log(parse(lex("10LETLET=4")));
