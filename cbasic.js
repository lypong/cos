const keywords = ["PRINT"]
const TokenType = {
  number : "number",
  identifier : "identifier",
  keyword : "keyword",
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
}
class Lexer {
  constructor(code) {
    this.code = code;
    this.position = 0;
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
  keywordOrIdentifier(c){
    let start = this.position-1;
    let peek = this.peek();
    while(isLetter(peek)||isDigit(peek)||peek==='_'){
      this.consume();
      if(keywords.includes(this.code.substring(start,this.position)))
        return new Token(TokenType.keyword,this.code.substring(start,this.position));
      peek = this.peek();
    }
    return new Token(TokenType.identifier,this.code.substring(start,this.position));
  }
  number(c){
    let start = this.position-1;
    let peek = this.peek();
    while(isDigit(peek)){
      this.consume();
      peek = this.peek();
    }
    let lexeme = this.code.substring(start,this.position);
    return new Token(TokenType.number,lexeme,parseInt(lexeme));
  }
}
function isDigit(c) {
  return c >= '0' && c <= '9';
}
function isLetter(c) {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
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
        tokens.push(new Token(TokenType.number,'0',0));
        break;
      default:
        if(singleCharacterTokens[c]!==undefined)
          tokens.push(new Token(singleCharacterTokens[c],c));
        else if(isLetter(c))
          tokens.push(lexer.keywordOrIdentifier());
        else if(isDigit(c)&&c!='0')
          tokens.push(lexer.number());
        else
          console.log(`Char ${c} can't be tokenized.`)
        break;
    }
  }
  return tokens;
}

console.log(lex("- + = <= <> <+ PRINTyak y12_a >= 1023 0"));
