// La classe Parser permet de naviguer à travers les tokens qui ont été lexés (voir lexer.ts). On peut créer des arbres d'expressions fait de nodes ou simplement consommer/voir token par token pour déterminer quelle suite de token correspond à quelle instruction.

class Parser {
  tokens: Token[];
  position: number;
  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.position = 0;
  }
  atEnd(offset?: number): boolean {
    if (offset === undefined) offset = 0;
    return this.position + offset >= this.tokens.length;
  }
  consume(): Token | null {
    if (this.atEnd()) return null;
    return this.tokens[this.position++];
  }
  peek(offset?: number): Token | null {
    if (offset === undefined) offset = 0;
    if (this.atEnd(offset)) return null;
    return this.tokens[this.position + offset];
  }
  matchAndConsume(t: TokenType): boolean {
    if (this.peek()?.type !== t) return false;
    this.consume();
    return true;
  }
  //TODO support exponentiation.
  factor(): BNode | null {
    let peek = this.peek();
    let unaryMinus = this.matchAndConsume(TokenType.minus);
    if (unaryMinus) {
      let f = this.factor();
      if (f === null) {
        return null;
      }
      return new BNode(TokenType.mult, -1, f);
    }
    switch (peek?.type) {
      case TokenType.openParen:
        this.consume();
        let e = this.expr();
        peek = this.peek();
        if (peek?.type !== TokenType.closeParen) return null;
        this.consume();
        return e;
      case TokenType.word:
        if (keywords.includes(peek.lexeme)) return null;
        this.consume();
        let name = peek.lexeme;
        peek = this.peek();
        if (peek?.type === TokenType.openParen) {
          let param = this.expr();
          if (param === null) return null;
          return new BNode("callFunc", name, param);
        }
        return new BNode("getVar", name);
      case TokenType.integer:
        this.consume();
        return new BNode(TokenType.plus, 0, peek.literal as number);
      default:
        return null;
    }
  }

  term(): BNode | null {
    let lhs = this.factor();
    if (lhs === null) return null;
    let multOrDiv = this.peek();
    let n = new BNode(TokenType.mult, lhs, 1);
    while (
      multOrDiv?.type === TokenType.mult ||
      multOrDiv?.type === TokenType.div
    ) {
      this.consume();
      let f = this.factor();
      if (f === null) return null;
      n.rhs = new BNode(multOrDiv.type, n.rhs as number | BNode, f);
      multOrDiv = this.peek();
    }
    return n;
  }

  expr(): BNode | null {
    let lhs;
    lhs = this.term();
    if (lhs === null) return null;
    let n = new BNode(TokenType.plus, lhs, 0);
    let plusOrMinus = this.peek();
    while (
      plusOrMinus?.type === TokenType.plus ||
      plusOrMinus?.type === TokenType.minus
    ) {
      this.consume();
      let t = this.term();
      if (t === null) return null;
      n.rhs = new BNode(plusOrMinus.type, n.rhs as number | BNode, t);
      plusOrMinus = this.peek();
    }

    return n;
  }
}
