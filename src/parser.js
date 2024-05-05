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
      return new BNode(TokenType.mult,-1,f);
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
        return new BNode(nodeGetVar,peek.lexeme);
      case TokenType.integer:
        this.consume();
        return new BNode(TokenType.plus,0,peek.literal);
      default: return null;
    }
  }

  term() {
    let lhs = this.factor();
    let multOrDiv = this.peek();
    let n = new BNode(TokenType.mult,lhs,1);
    while(multOrDiv?.type === TokenType.mult || multOrDiv?.type === TokenType.div) {
      this.consume();
      let f = this.factor();
      if(f===null)
        return null;
      n.rhs = new BNode(multOrDiv.type,n.rhs,f);
      multOrDiv = this.peek();
    }
    return n;
  }

  expr() {
    let lhs;
    lhs = this.term(); 
    let n = new BNode(TokenType.plus,lhs,0);
    let plusOrMinus = this.peek();
    while(plusOrMinus?.type === TokenType.plus || plusOrMinus?.type === TokenType.minus){
      this.consume();
      let t = this.term();
      if(t===null)
        return null;
      n.rhs = new BNode(plusOrMinus.type,n.rhs,t);
      plusOrMinus = this.peek();
    }

    return n;
  }
}
