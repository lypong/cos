class Lexer {
  code : string;
  position : number;
  lexedKeyword : boolean;
  constructor(code : string) {
    this.code = code;
    this.position = 0;
    this.lexedKeyword = false;
  }
  lex() : Token[]{
    let tokens = [];
    while(!this.atEnd()) {
      let c = this.consume() as string;
      switch(c) {
        case '<':
          if(this.matchAndConsume('='))
            tokens.push(new Token(TokenType.lessOrEqual,"<="));
          else if(this.matchAndConsume('>'))
            tokens.push(new Token(TokenType.notEqual,"<>"));
          else
            tokens.push(new Token(TokenType.less,'<'));
          break;
        case '>':
          if(this.matchAndConsume('='))
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
          tokens.push(this.label());
          break;
        default:
          let s = singleCharacterTokens[c as keyof typeof singleCharacterTokens];
          if(s!==undefined)
            tokens.push(new Token(s,c));
          else if(isLetter(c))
            tokens.push(this.word());
          else if(isDigit(c)&&c!='0')
            tokens.push(this.integer());
          else
            throw new Error(`Char ${c} can't be tokenized.`);
          break;
      }
    }
    return tokens;
  }
  atEnd(offset? : number) : boolean {
    if(offset === undefined)
      offset = 0;
    return this.position + offset >=this.code.length;
  }
  consume() : string|null {
    if (this.atEnd())
      return null;
    return this.code[this.position++];
  }
  peek(offset? : number) : string|null {
    if(offset === undefined)
      offset = 0;
    if(this.atEnd(offset))
      return null;
    return this.code[this.position+offset];
  }
  matchAndConsume(c : string) : boolean{
    if(this.peek()!==c)
      return false;
    this.consume();
    return true;
  }
  word() : Token{
    let start = this.position-1;
    let peek = this.peek();
    let sub = this.code[start];
    // if peek is null condition won't be met.
    while(isLetter(peek as string)||isDigit(peek as string)||peek==='_'){
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
  integer() : Token{
    let start = this.position-1;
    let peek = this.peek();
    // if peek is null condition won't be met.
    while(isDigit(peek as string)){
      this.consume();
      peek = this.peek();
    }
    let lexeme = this.code.substring(start,this.position);
    return new Token(TokenType.integer,lexeme,parseInt(lexeme));
  }
  label() : Token{
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
