// Un lexer permet de générerer des tokens
// en itérant une liste de caractères.

class Lexer {
  code: string;
  position: number;
  lexedKeyword: boolean;
  constructor(code: string) {
    this.code = code;
    this.position = 0;
    this.lexedKeyword = false;
  }
  lex(): Token[] {
    let tokens = [];
    while (!this.atEnd()) {
      let c = this.consume() as string;
      switch (c) {
        // < ou <= ou <>
        case "<":
          if (this.matchAndConsume("="))
            tokens.push(new Token(TokenType.lessOrEqual, "<="));
          else if (this.matchAndConsume(">"))
            tokens.push(new Token(TokenType.notEqual, "<>"));
          else tokens.push(new Token(TokenType.less, "<"));
          break;
        // > ou >=
        case ">":
          if (this.matchAndConsume("="))
            tokens.push(new Token(TokenType.greaterOrEqual, ">="));
          else tokens.push(new Token(TokenType.greater, ">"));
          break;
        // On ne fait rien
        case " ":
        case "\t":
        case "\r":
          break;
        // Un nombre ne peut pas commencer par 0 sauf s'il vaut 0.
        // Notre token peut déjà être produit.
        case "0":
          tokens.push(new Token(TokenType.integer, "0", 0));
          break;
        case '"':
          tokens.push(this.label());
          break;
        // On va regarder si on peut générer un nombre, un opérateur
        // ou un identifiant/mot clé. Le cas échéant, le caractère ne peut
        // pas engendrer un token.
        default:
          let s =
            singleCharacterTokens[c as keyof typeof singleCharacterTokens];
          if (s !== undefined) tokens.push(new Token(s, c));
          else if (isLetter(c)) tokens.push(this.word());
          else if (isDigit(c) && c != "0") tokens.push(this.integer());
          else throw new Error(`Char ${c} can't be tokenized.`);
          break;
      }
    }
    return tokens;
  }
  atEnd(offset?: number): boolean {
    if (offset === undefined) offset = 0;
    return this.position + offset >= this.code.length;
  }
  consume(): string | null {
    if (this.atEnd()) return null;
    return this.code[this.position++];
  }
  peek(offset?: number): string | null {
    if (offset === undefined) offset = 0;
    if (this.atEnd(offset)) return null;
    return this.code[this.position + offset];
  }
  matchAndConsume(c: string): boolean {
    if (this.peek() !== c) return false;
    this.consume();
    return true;
  }
  word(): Token {
    let start = this.position - 1;
    let peek = this.peek();
    let sub = this.code[start];
    // if peek is null condition won't be met.
    // On consomme tant que le caractère
    // est valide : chiffre, lettre ou _
    while (
      isLetter(peek as string) ||
      isDigit(peek as string) ||
      peek === "_"
    ) {
      this.consume();
      sub = this.code.substring(start, this.position);
      // On regarde si on est déjà 
      // tombé sur un mot clé et
      // que notre chaîne de caractère
      // est un mot clé. Pour pouvoir
      // créer directement notre token.

      if (!this.lexedKeyword && keywords.includes(sub)) {
        // Certains statements sont
        // composés de plusieurs mots
        // clés. on s'attend à trouver
        // les suivants donc on n'active
        // pas lexedKeyword.
        if (sub !== "IF" && sub !== "FOR" && sub !== "TO")
          this.lexedKeyword = true;
        return new Token(TokenType.word, sub);
      }
      peek = this.peek();
    }
    return new Token(TokenType.word, sub);
  }
  integer(): Token {
    let start = this.position - 1;
    let peek = this.peek();
    // if peek is null condition won't be met.
    // On consomme tant que le caractère
    // est valide : chiffre
    while (isDigit(peek as string)) {
      this.consume();
      peek = this.peek();
    }
    let lexeme = this.code.substring(start, this.position);
    return new Token(TokenType.integer, lexeme, parseInt(lexeme));
  }
  label(): Token {
    let start = this.position - 1;
    let peek = this.peek();
    // On consomme jusqu'à trouver
    // le second " .
    while (peek !== '"' && !this.atEnd()) {
      this.consume();
      peek = this.peek();
    }
    this.consume();
    let lexeme = this.code.substring(start, this.position);
    // On vérifie que le label est fermé.
    if(lexeme[lexeme.length-1]!=='"')
      throw new Error(`Unclosed label.`);
    return new Token(
      TokenType.label,
      lexeme,
      lexeme.slice(1, lexeme.length - 1),
    );
  }
}
