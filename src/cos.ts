class Line {
  source: string;
  tokens: Token[];
  lineNumber: number;
  constructor(source: string, tokens: Token[], lineNumber: number) {
    this.source = source;
    this.tokens = tokens;
    this.lineNumber = lineNumber;
  }
}
class For {
  start: number;
  variableName: string;
  to: number;
  step: number;
  constructor(start: number, variableName: string, to: number, step: number) {
    this.start = start;
    this.variableName = variableName;
    this.to = to;
    this.step = step;
  }
}
class Program {
  vars: { [x: string]: number };
  lines: { [x: string]: Line };
  goSubStack: number[];
  forStack: For[];
  instructionPointer: number;
  ended: boolean;
  OrderedLines?: Line[];
  constructor() {
    this.vars = {};
    this.lines = {};
    this.goSubStack = [];
    this.forStack = [];
    this.instructionPointer = 0;
    this.ended = false;
  }
  listLines() {
    this.generateOrderedLines();
    this.OrderedLines?.forEach((l) => bPrint(l.source));
  }
  generateOrderedLines() {
    this.OrderedLines = Object.values(this.lines);
    this.OrderedLines.sort((a, b) => a.lineNumber - b.lineNumber);
  }
  partialReset() {
    this.vars = {};
    this.goSubStack = [];
    this.forStack = [];
    this.instructionPointer = 0;
    this.ended = false;
  }
  crash(errorMessage: string) {
    if (
      this.OrderedLines === undefined ||
      this.OrderedLines[this.instructionPointer - 1] === undefined
    )
      bPrint(errorMessage);
    else
      bPrint(
        `${errorMessage} line : ${this.OrderedLines[this.instructionPointer - 1].source}`,
      );
    this.ended = true;
  }
  writeLine(source: string): boolean {
    let tokens = new Lexer(source).lex();
    let parser = new Parser(tokens);
    let lineNumber = parser.peek();
    if (lineNumber?.type !== TokenType.integer) {
      this.crash("No line number was provided. Please provide one.");
      return false;
    }
    this.lines[lineNumber.lexeme] = new Line(
      source,
      tokens,
      lineNumber.literal as number,
    );
    return true;
  }
  goTo(lineNumber: number): boolean {
    let low = 0;
    if (this.OrderedLines === undefined) {
      this.crash("BUG: Lines are not sorted out");
      return false;
    }
    let high = this.OrderedLines.length;
    let mid = low + Math.floor((high - low) / 2);
    while (this.OrderedLines[mid].lineNumber !== lineNumber) {
      if (high - 1 <= low) {
        this.instructionPointer = mid;
        if (this.OrderedLines[mid].lineNumber < lineNumber)
          this.instructionPointer++;
        return true;
      }
      if (this.OrderedLines[mid].lineNumber < lineNumber) low = mid;
      else high = mid;
      mid = low + Math.floor((high - low) / 2);
    }
    this.instructionPointer = mid;
    return true;
  }
  runProgram() {
    this.partialReset();
    this.generateOrderedLines();
    this.ended = false;
    if (this.OrderedLines === undefined) {
      this.crash("BUG: Lines are not sorted out");
      return false;
    }
    while (this.instructionPointer < this.OrderedLines.length && !this.ended) {
      this.runStatement(this.OrderedLines[this.instructionPointer++].tokens);
    }
  }
  runStatement(tokens: Token[]): undefined {
    let parser = new Parser(tokens);
    let lineNumber = parser.consume() as Token;
    expectDefinedOrThrow(lineNumber,"Wanted line number but tokens are empty");
    expectEqualOrThrow(lineNumber.type,TokenType.integer,`Expected line number got ${lineNumber.lexeme}`);
    let expr,evaluation,variableName;
    let goSub = false;
    let keyword = parser.consume() as Token;
    expectDefinedOrThrow(keyword, "Wanted keyword but tokens are empty");
    switch (keyword.lexeme) {
      case "LET":
        variableName = parser.consume() as Token;
        expectDefinedOrThrow(variableName,"Wanted variable name but tokens are empty");
        expectEqualOrThrow(variableName.type,TokenType.word,`Expected variable name got ${variableName.lexeme}`);
        expectNotKeywordOrThrow(variableName,`Expected variable name name got keyword instead : ${variableName.lexeme}`);
        if (!parser.matchAndConsume(TokenType.equal))
          throw new Error("Expected = after variable name");
        expr = parser.expr() as BNode;
        expectDefinedOrThrow(expr, "Failed to create tree for expression");
        evaluation = expr.evaluate(this.vars) as number;
        expectDefinedOrThrow(evaluation, "Could not evaluate expression");
        this.vars[(variableName as Token).lexeme] = evaluation;
        break;
      case "PRINT":
        let label = parser.peek();
        let literal = "";
        if (label?.type === TokenType.label) {
          parser.consume();
          literal = label.literal as string;
        }
        if (parser.atEnd()) {
          bPrint(literal);
          break;
        }
        expr = parser.expr() as BNode;
        expectDefinedOrThrow(expr, "Failed to create tree for expression");
        evaluation = expr.evaluate(this.vars) as number;
        expectDefinedOrThrow(evaluation, "Could not evaluate expression");
        if (!parser.atEnd()) throw new Error("Invalid expression");
        bPrint(`${literal}${evaluation}`);
        break;
      case "END":
        if (!parser.atEnd()) throw new Error("Invalid expression");
        this.ended = true;
        break;
      case "RETURN":
        let pop = this.goSubStack.pop() as number;
        expectDefinedOrThrow(pop,"Could not return because return stack is empty");
        if (!parser.atEnd())
          throw new Error("There shall be nothing after RETURN");
        this.goTo(pop);
        break;
      case "GOSUB":
        expectDefinedOrThrow(this.OrderedLines,"BUG: Lines are not sorted out");
        goSub = true;
      case "GOTO":
        lineNumber = parser.consume() as Token;
        expectEqualOrThrow(lineNumber?.type,TokenType.integer,"Expected line number after GOTO")
        if (!parser.atEnd())
          throw new Error("There shall be nothing after line number");
        if (goSub)
          this.goSubStack.push(
            (this.OrderedLines as Line[])[this.instructionPointer].lineNumber,
          );
        this.goTo((lineNumber as Token).literal as number);
        break;
      case "IF":
        expr = parser.expr() as BNode;
        expectDefinedOrThrow(expr, "Failed to create tree for expression");
        evaluation = expr.evaluate(this.vars) as number;
        expectDefinedOrThrow(evaluation, "Could not evaluate expression");
        let relational = parser.consume();
        let exprRhs = parser.expr() as BNode;
        expectDefinedOrThrow(exprRhs,"Failed to create tree for right-hand side expression");
        let evaluationRhs = exprRhs.evaluate(this.vars) as number;
        expectDefinedOrThrow(evaluationRhs,"Could not evaluate right-hand side expression");
        let thenKeyword = parser.consume() as Token;
        expectDefinedOrThrow(thenKeyword,"Expected THEN after comparison");
        expectEqualOrThrow(thenKeyword.lexeme,"THEN",`Expected THEN after comparison got ${thenKeyword?.lexeme}`);
        lineNumber = parser.consume() as Token;
        expectDefinedOrThrow(lineNumber,"Expected line number after THEN");
        expectEqualOrThrow(lineNumber.type,TokenType.integer,`Expected line number after THEN got ${lineNumber?.lexeme}`);
        let ok;
        switch (relational?.type) {
          case TokenType.less:
            ok = evaluation < evaluationRhs;
            break;
          case TokenType.greater:
            ok = evaluation > evaluationRhs;
            break;
          case TokenType.lessOrEqual:
            ok = evaluation <= evaluationRhs;
            break;
          case TokenType.greaterOrEqual:
            ok = evaluation >= evaluationRhs;
            break;
          case TokenType.equal:
            ok = evaluation === evaluationRhs;
            break;
          case TokenType.notEqual:
            ok = evaluation !== evaluationRhs;
            break;
          default:
            this.crash(`Expected relational got ${relational?.asString}`);
        }
        if (!parser.atEnd())
          throw new Error("There shall be nothing after line number");
        if (ok) this.goTo(lineNumber.literal as number);
        break;
      case "FOR":
        variableName = parser.consume() as Token;
        expectDefinedOrThrow(variableName,"Expected variable name");
        expectEqualOrThrow(variableName.type,TokenType.word,`Expected variable name got ${variableName.lexeme}`);
        expectNotKeywordOrThrow(variableName,`Expected variable name got keyword ${(variableName as Token).lexeme}`);
        if (!parser.matchAndConsume(TokenType.equal))
          throw new Error("Expected = after variable name");
        expr = parser.expr() as BNode;
        expectDefinedOrThrow(expr, "Failed to create tree for expression");
        evaluation = expr.evaluate(this.vars) as number;
        expectDefinedOrThrow(evaluation, "Could not evaluate expression");
        let toKeyword = parser.consume() as Token;
        expectDefinedOrThrow(toKeyword,"Expected keyword TO");
        expectEqualOrThrow(toKeyword.lexeme,"TO",`Expected keyword TO got ${toKeyword.lexeme}`);
        let toExpr = parser.expr() as BNode;
        expectDefinedOrThrow(toExpr,"Failed to create tree for expression after TO");
        let toEvaluation = toExpr.evaluate(this.vars) as number;
        expectDefinedOrThrow(toEvaluation,"Could not evaluate expression after TO");
        let stepKeyword = parser.peek();
        let stepEvaluation = 1;
        if (stepKeyword?.lexeme === "STEP") {
          parser.consume();
          let stepExpr = parser.expr() as BNode;
          expectDefinedOrThrow(stepExpr,"Failed to create tree for expression after STEP");
          let e = stepExpr.evaluate(this.vars) as number;
          expectDefinedOrThrow(e, "Could not evaluate expression after STEP");
          stepEvaluation = e;
        }
        if (!parser.atEnd())
          throw new Error("Invalid expression");
        expectDefinedOrThrow(this.OrderedLines,"BUG: Lines are not sorted out");
        let OrderedLines = this.OrderedLines as Line[];
        this.vars[(variableName as Token).lexeme] = evaluation;
        if (
          (stepEvaluation > 0 && evaluation > toEvaluation) ||
          (stepEvaluation < 0 && evaluation < toEvaluation)
        ) {
          while (
            OrderedLines[++this.instructionPointer]?.tokens[1]?.lexeme !==
              "NEXT" ||
            OrderedLines[this.instructionPointer]?.tokens[2]?.lexeme !==
              (variableName as Token).lexeme
          )
            if (this.instructionPointer >= OrderedLines.length)
              throw new Error("No corresponding NEXT statement found");
          this.instructionPointer++; //skips next
        } else
          this.forStack.push(
            new For(
              this.instructionPointer,
              (variableName as Token).lexeme,
              toEvaluation,
              stepEvaluation,
            ),
          );
        break;
      case "NEXT":
        variableName = parser.consume() as Token;
        expectDefinedOrThrow(variableName,"Expected variable name");
        expectEqualOrThrow(variableName.type,TokenType.word,`Expected variable name got ${variableName.lexeme}`);
        expectNotKeywordOrThrow(variableName,`Expected variable name got keyword ${(variableName as Token).lexeme}`);
        let topOfStack = this.forStack[this.forStack.length-1];
        expectDefinedOrThrow(topOfStack?.variableName,"No opened FOR statement");
        expectEqualOrThrow(topOfStack.variableName,variableName.lexeme,`NEXT statement does not match with FOR ${topOfStack?.variableName}<>${(variableName as Token).lexeme}`);
        if (!parser.atEnd())
          throw new Error("There shall be nothing after variable name");
        this.vars[(variableName as Token).lexeme] += topOfStack.step;
        if (topOfStack.step > 0) {
          if (this.vars[(variableName as Token).lexeme] > topOfStack.to)
            this.forStack.pop();
          else this.instructionPointer = topOfStack.start;
        } else {
          if (this.vars[(variableName as Token).lexeme] < topOfStack.to)
            this.forStack.pop();
          else this.instructionPointer = topOfStack.start;
        }
        break;
      case "REM":
        break;
      default:
        throw new Error(`Expected keyword got ${keyword.lexeme}`);
    }
    if (!parser.atEnd())
      throw new Error("BUG: Tokens weren't entirely consumed.");
  }
}
