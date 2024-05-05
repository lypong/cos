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
    return new Token(TokenType.label,lexeme,lexeme.slice(1,lexeme.length-1));
  }
}