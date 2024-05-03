const keywords = ["LET"];
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
    if(this.peek().type!==t)
      return false;
    this.consume();
    return true;
  }
  num() {
    if(this.peek().type===TokenType.minus && this.peek(1).type===TokenType.integer)
      return new Node(this.consume().type,0,this.consume().literal);
    if(this.peek().type===TokenType.integer) 
      return new Node(TokenType.plus,0,this.consume().literal);
    return null;
  }

  expr() {
    let lhs = this.num();
    //TODO Support more complex expr.

    return lhs;
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

function parse(tokens){
  let parser = new Parser(tokens);
  let lineNumber = parser.consume();
  if(lineNumber.type!=TokenType.integer) {
    console.log(`Expected line number got ${lineNumber.asString()}`);
    return;
  }
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
      let expr = parser.expr();
      //TODO implement actual behaviour.
      console.log(`I WILL make var : ${variableName.lexeme} equal to ${expr.evaluate()}`)
      break;
    default:
      console.log(`Expected keyword got ${keyword}`);
      return;
  }
  if(!parser.atEnd()) //TODO DELETE
    console.log(`Tokens weren't entirely consumed.`); //TODO DELETE
}

console.log(lex("- + = <= <> <+ PRINTyak y12_a >= 1023 0"));
console.log(lex("10LETLET=4"))
console.log(parse(lex("10LETpip=4")));
//console.log(parse(lex("10LETLET=4")));
