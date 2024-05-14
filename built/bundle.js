"use strict";
// Ce fichier comporte une liste de fonctions
// permettant de vérifier de manière pratique et rapide
// la validité de variables.
function expectEqualOrThrow(lhs, rhs, errorMessage) {
    if (lhs !== rhs)
        throw new Error(errorMessage);
}
function expectDefinedOrThrow(value, errorMessage) {
    if (value === undefined || value === null)
        throw new Error(errorMessage);
}
function expectNotKeywordOrThrow(value, errorMessage) {
    if (keywords.includes(value.lexeme))
        throw new Error(errorMessage);
}
// Ce fichier contient la logique d'interprétations des tokens
// qui sont analysés à l'aide du parser.
// Il gère une classe appelé Program
// qui est une sorte de machine virtuelle.
// Elle contient l'état du programme.
class Line {
    constructor(source, tokens, lineNumber) {
        this.source = source;
        this.tokens = tokens;
        this.lineNumber = lineNumber;
    }
}
class For {
    constructor(start, variableName, to, step) {
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
    listLines() {
        var _a;
        this.generateOrderedLines();
        (_a = this.OrderedLines) === null || _a === void 0 ? void 0 : _a.forEach((l) => bPrint(l.source));
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
    crash(errorMessage) {
        if (this.OrderedLines === undefined ||
            this.OrderedLines[this.instructionPointer - 1] === undefined)
            bPrint(errorMessage);
        else
            bPrint(`${errorMessage} line : ${this.OrderedLines[this.instructionPointer - 1].source}`);
        this.ended = true;
    }
    writeLine(source) {
        let tokens = new Lexer(source).lex();
        let parser = new Parser(tokens);
        let lineNumber = parser.peek();
        if ((lineNumber === null || lineNumber === void 0 ? void 0 : lineNumber.type) !== TokenType.integer) {
            this.crash("No line number was provided. Please provide one.");
            return false;
        }
        this.lines[lineNumber.lexeme] = new Line(source, tokens, lineNumber.literal);
        return true;
    }
    goTo(lineNumber) {
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
            if (this.OrderedLines[mid].lineNumber < lineNumber)
                low = mid;
            else
                high = mid;
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
    runStatement(tokens) {
        var _a, _b, _c, _d;
        let parser = new Parser(tokens);
        let lineNumber = parser.consume();
        expectDefinedOrThrow(lineNumber, "Wanted line number but tokens are empty");
        expectEqualOrThrow(lineNumber.type, TokenType.integer, `Expected line number got ${lineNumber.lexeme}`);
        let expr, evaluation, variableName;
        let goSub = false;
        let keyword = parser.consume();
        expectDefinedOrThrow(keyword, "Wanted keyword but tokens are empty");
        switch (keyword.lexeme) {
            case "LET":
                variableName = parser.consume();
                expectDefinedOrThrow(variableName, "Wanted variable name but tokens are empty");
                expectEqualOrThrow(variableName.type, TokenType.word, `Expected variable name got ${variableName.lexeme}`);
                expectNotKeywordOrThrow(variableName, `Expected variable name name got keyword instead : ${variableName.lexeme}`);
                if (!parser.matchAndConsume(TokenType.equal))
                    throw new Error("Expected = after variable name");
                expr = parser.expr();
                expectDefinedOrThrow(expr, "Failed to create tree for expression");
                evaluation = expr.evaluate(this.vars);
                expectDefinedOrThrow(evaluation, "Could not evaluate expression");
                this.vars[variableName.lexeme] = evaluation;
                break;
            case "PRINT":
                let label = parser.peek();
                let literal = "";
                if ((label === null || label === void 0 ? void 0 : label.type) === TokenType.label) {
                    parser.consume();
                    literal = label.literal;
                }
                if (parser.atEnd()) {
                    bPrint(literal);
                    break;
                }
                expr = parser.expr();
                expectDefinedOrThrow(expr, "Failed to create tree for expression");
                evaluation = expr.evaluate(this.vars);
                expectDefinedOrThrow(evaluation, "Could not evaluate expression");
                if (!parser.atEnd())
                    throw new Error("Invalid expression");
                bPrint(`${literal}${evaluation}`);
                break;
            case "END":
                if (!parser.atEnd())
                    throw new Error("Invalid expression");
                this.ended = true;
                break;
            case "RETURN":
                let pop = this.goSubStack.pop();
                expectDefinedOrThrow(pop, "Could not return because return stack is empty");
                if (!parser.atEnd())
                    throw new Error("There shall be nothing after RETURN");
                this.goTo(pop);
                break;
            case "GOSUB":
                expectDefinedOrThrow(this.OrderedLines, "BUG: Lines are not sorted out");
                goSub = true;
            case "GOTO":
                lineNumber = parser.consume();
                expectEqualOrThrow(lineNumber === null || lineNumber === void 0 ? void 0 : lineNumber.type, TokenType.integer, "Expected line number after GOTO");
                if (!parser.atEnd())
                    throw new Error("There shall be nothing after line number");
                if (goSub)
                    this.goSubStack.push(this.OrderedLines[this.instructionPointer].lineNumber);
                this.goTo(lineNumber.literal);
                break;
            case "IF":
                expr = parser.expr();
                expectDefinedOrThrow(expr, "Failed to create tree for expression");
                evaluation = expr.evaluate(this.vars);
                expectDefinedOrThrow(evaluation, "Could not evaluate expression");
                let relational = parser.consume();
                let exprRhs = parser.expr();
                expectDefinedOrThrow(exprRhs, "Failed to create tree for right-hand side expression");
                let evaluationRhs = exprRhs.evaluate(this.vars);
                expectDefinedOrThrow(evaluationRhs, "Could not evaluate right-hand side expression");
                let thenKeyword = parser.consume();
                expectDefinedOrThrow(thenKeyword, "Expected THEN after comparison");
                expectEqualOrThrow(thenKeyword.lexeme, "THEN", `Expected THEN after comparison got ${thenKeyword === null || thenKeyword === void 0 ? void 0 : thenKeyword.lexeme}`);
                lineNumber = parser.consume();
                expectDefinedOrThrow(lineNumber, "Expected line number after THEN");
                expectEqualOrThrow(lineNumber.type, TokenType.integer, `Expected line number after THEN got ${lineNumber === null || lineNumber === void 0 ? void 0 : lineNumber.lexeme}`);
                let ok;
                switch (relational === null || relational === void 0 ? void 0 : relational.type) {
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
                        this.crash(`Expected relational got ${relational === null || relational === void 0 ? void 0 : relational.asString}`);
                }
                if (!parser.atEnd())
                    throw new Error("There shall be nothing after line number");
                if (ok)
                    this.goTo(lineNumber.literal);
                break;
            case "FOR":
                variableName = parser.consume();
                expectDefinedOrThrow(variableName, "Expected variable name");
                expectEqualOrThrow(variableName.type, TokenType.word, `Expected variable name got ${variableName.lexeme}`);
                expectNotKeywordOrThrow(variableName, `Expected variable name got keyword ${variableName.lexeme}`);
                if (!parser.matchAndConsume(TokenType.equal))
                    throw new Error("Expected = after variable name");
                expr = parser.expr();
                expectDefinedOrThrow(expr, "Failed to create tree for expression");
                evaluation = expr.evaluate(this.vars);
                expectDefinedOrThrow(evaluation, "Could not evaluate expression");
                let toKeyword = parser.consume();
                expectDefinedOrThrow(toKeyword, "Expected keyword TO");
                expectEqualOrThrow(toKeyword.lexeme, "TO", `Expected keyword TO got ${toKeyword.lexeme}`);
                let toExpr = parser.expr();
                expectDefinedOrThrow(toExpr, "Failed to create tree for expression after TO");
                let toEvaluation = toExpr.evaluate(this.vars);
                expectDefinedOrThrow(toEvaluation, "Could not evaluate expression after TO");
                let stepKeyword = parser.peek();
                let stepEvaluation = 1;
                if ((stepKeyword === null || stepKeyword === void 0 ? void 0 : stepKeyword.lexeme) === "STEP") {
                    parser.consume();
                    let stepExpr = parser.expr();
                    expectDefinedOrThrow(stepExpr, "Failed to create tree for expression after STEP");
                    let e = stepExpr.evaluate(this.vars);
                    expectDefinedOrThrow(e, "Could not evaluate expression after STEP");
                    stepEvaluation = e;
                }
                if (!parser.atEnd())
                    throw new Error("Invalid expression");
                expectDefinedOrThrow(this.OrderedLines, "BUG: Lines are not sorted out");
                let OrderedLines = this.OrderedLines;
                this.vars[variableName.lexeme] = evaluation;
                if ((stepEvaluation > 0 && evaluation > toEvaluation) ||
                    (stepEvaluation < 0 && evaluation < toEvaluation)) {
                    while (((_b = (_a = OrderedLines[++this.instructionPointer]) === null || _a === void 0 ? void 0 : _a.tokens[1]) === null || _b === void 0 ? void 0 : _b.lexeme) !==
                        "NEXT" ||
                        ((_d = (_c = OrderedLines[this.instructionPointer]) === null || _c === void 0 ? void 0 : _c.tokens[2]) === null || _d === void 0 ? void 0 : _d.lexeme) !==
                            variableName.lexeme)
                        if (this.instructionPointer >= OrderedLines.length)
                            throw new Error("No corresponding NEXT statement found");
                    this.instructionPointer++; //skips next
                }
                else
                    this.forStack.push(new For(this.instructionPointer, variableName.lexeme, toEvaluation, stepEvaluation));
                break;
            case "NEXT":
                variableName = parser.consume();
                expectDefinedOrThrow(variableName, "Expected variable name");
                expectEqualOrThrow(variableName.type, TokenType.word, `Expected variable name got ${variableName.lexeme}`);
                expectNotKeywordOrThrow(variableName, `Expected variable name got keyword ${variableName.lexeme}`);
                let topOfStack = this.forStack[this.forStack.length - 1];
                expectDefinedOrThrow(topOfStack === null || topOfStack === void 0 ? void 0 : topOfStack.variableName, "No opened FOR statement");
                expectEqualOrThrow(topOfStack.variableName, variableName.lexeme, `NEXT statement does not match with FOR ${topOfStack === null || topOfStack === void 0 ? void 0 : topOfStack.variableName}<>${variableName.lexeme}`);
                if (!parser.atEnd())
                    throw new Error("There shall be nothing after variable name");
                this.vars[variableName.lexeme] += topOfStack.step;
                if (topOfStack.step > 0) {
                    if (this.vars[variableName.lexeme] > topOfStack.to)
                        this.forStack.pop();
                    else
                        this.instructionPointer = topOfStack.start;
                }
                else {
                    if (this.vars[variableName.lexeme] < topOfStack.to)
                        this.forStack.pop();
                    else
                        this.instructionPointer = topOfStack.start;
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
function example() {
    let p = new Program();
    p.writeLine("10 FOR P=1 TO 10");
    p.writeLine("15 FOR C=1 TO 10");
    p.writeLine('20 PRINT "-C="-C-2*5');
    p.writeLine("25 NEXT C");
    p.writeLine("26 NEXT P");
    p.writeLine("30 PRINT 1");
    p.runProgram();
}
// Un lexer permet de générerer des tokens
// en itérant une liste de caractères.
class Lexer {
    constructor(code) {
        this.code = code;
        this.position = 0;
        this.lexedKeyword = false;
    }
    lex() {
        let tokens = [];
        while (!this.atEnd()) {
            let c = this.consume();
            switch (c) {
                case "<":
                    if (this.matchAndConsume("="))
                        tokens.push(new Token(TokenType.lessOrEqual, "<="));
                    else if (this.matchAndConsume(">"))
                        tokens.push(new Token(TokenType.notEqual, "<>"));
                    else
                        tokens.push(new Token(TokenType.less, "<"));
                    break;
                case ">":
                    if (this.matchAndConsume("="))
                        tokens.push(new Token(TokenType.greaterOrEqual, ">="));
                    else
                        tokens.push(new Token(TokenType.greater, ">"));
                    break;
                case " ":
                case "\t":
                case "\r":
                    break;
                case "0":
                    tokens.push(new Token(TokenType.integer, "0", 0));
                    break;
                case '"':
                    tokens.push(this.label());
                    break;
                default:
                    let s = singleCharacterTokens[c];
                    if (s !== undefined)
                        tokens.push(new Token(s, c));
                    else if (isLetter(c))
                        tokens.push(this.word());
                    else if (isDigit(c) && c != "0")
                        tokens.push(this.integer());
                    else
                        throw new Error(`Char ${c} can't be tokenized.`);
                    break;
            }
        }
        return tokens;
    }
    atEnd(offset) {
        if (offset === undefined)
            offset = 0;
        return this.position + offset >= this.code.length;
    }
    consume() {
        if (this.atEnd())
            return null;
        return this.code[this.position++];
    }
    peek(offset) {
        if (offset === undefined)
            offset = 0;
        if (this.atEnd(offset))
            return null;
        return this.code[this.position + offset];
    }
    matchAndConsume(c) {
        if (this.peek() !== c)
            return false;
        this.consume();
        return true;
    }
    word() {
        let start = this.position - 1;
        let peek = this.peek();
        let sub = this.code[start];
        // if peek is null condition won't be met.
        while (isLetter(peek) ||
            isDigit(peek) ||
            peek === "_") {
            this.consume();
            sub = this.code.substring(start, this.position);
            if (!this.lexedKeyword && keywords.includes(sub)) {
                if (sub !== "IF" && sub !== "FOR" && sub !== "TO")
                    this.lexedKeyword = true;
                return new Token(TokenType.word, sub);
            }
            peek = this.peek();
        }
        return new Token(TokenType.word, sub);
    }
    integer() {
        let start = this.position - 1;
        let peek = this.peek();
        // if peek is null condition won't be met.
        while (isDigit(peek)) {
            this.consume();
            peek = this.peek();
        }
        let lexeme = this.code.substring(start, this.position);
        return new Token(TokenType.integer, lexeme, parseInt(lexeme));
    }
    label() {
        let start = this.position - 1;
        let peek = this.peek();
        while (peek !== '"' && !this.atEnd()) {
            this.consume();
            peek = this.peek();
        }
        this.consume();
        let lexeme = this.code.substring(start, this.position);
        return new Token(TokenType.label, lexeme, lexeme.slice(1, lexeme.length - 1));
    }
}
// Les nodes permettent de représenter une expression en forme d'arbre.
// le bas de l'arbre (analogie : feuilles) est évalué en premier
// de manière récursive jusqu'à atteindre et évaluer
// la node se trouvant à la base.
// Le besoin de ces arbres se justifie par l'ordre des opérations.
// (voir recursive descent parser)
// (explicité dans le livre "Crafting Interpreters")
const builtins = {
    INT: Math.trunc,
    RND: Math.random,
    SIN: Math.sin,
    COS: Math.cos,
    TAN: Math.tan,
    ATN: Math.atan,
    EXP: Math.exp,
    ABS: Math.abs,
    LOG: (n) => Math.log(Math.abs(n)),
    SQR: (n) => Math.sqrt(Math.abs(n)),
};
class BNode {
    constructor(operator, lhs, rhs) {
        this.operator = operator;
        this.lhs = lhs;
        this.rhs = rhs;
    }
    evaluate(vars) {
        var _a;
        let evaluatedLhs;
        let evaluatedRhs;
        if (this.operator === "callFunc") {
            let f = builtins[this.lhs];
            if (f === undefined)
                return null;
            let evaluated = this.rhs.evaluate(vars);
            if (evaluated === null)
                return null;
            return f(evaluated);
        }
        if (this.lhs.evaluate === undefined)
            evaluatedLhs = this.lhs;
        else {
            let evaluated = this.lhs.evaluate(vars);
            if (evaluated === null)
                return null;
            evaluatedLhs = evaluated;
        }
        // rhs can be undefined with operator nodeGetVar;
        if (this.operator === "getVar")
            return (_a = vars[this.lhs]) !== null && _a !== void 0 ? _a : 0;
        if (this.rhs.evaluate === undefined)
            evaluatedRhs = this.rhs;
        else {
            let evaluated = this.rhs.evaluate(vars);
            if (evaluated === null)
                return null;
            evaluatedRhs = evaluated;
        }
        switch (this.operator) {
            case TokenType.plus:
                return evaluatedLhs + evaluatedRhs;
            case TokenType.minus:
                return evaluatedLhs - evaluatedRhs;
            case TokenType.mult:
                return evaluatedLhs * evaluatedRhs;
            case TokenType.div:
                return evaluatedLhs / evaluatedRhs;
            case TokenType.exp:
                return evaluatedLhs ** evaluatedRhs;
        }
    }
}
// La classe Parser permet de naviguer à travers les tokens 
// qui ont été lexés (voir lexer.ts). 
// On peut créer des arbres d'expressions fait de nodes 
// ou simplement consommer/voir token par token pour déterminer
// quelle suite de token correspond à quelle instruction.
class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.position = 0;
    }
    atEnd(offset) {
        if (offset === undefined)
            offset = 0;
        return this.position + offset >= this.tokens.length;
    }
    consume() {
        if (this.atEnd())
            return null;
        return this.tokens[this.position++];
    }
    peek(offset) {
        if (offset === undefined)
            offset = 0;
        if (this.atEnd(offset))
            return null;
        return this.tokens[this.position + offset];
    }
    matchAndConsume(t) {
        var _a;
        if (((_a = this.peek()) === null || _a === void 0 ? void 0 : _a.type) !== t)
            return false;
        this.consume();
        return true;
    }
    //TODO support exponentiation.
    factor() {
        let peek = this.peek();
        let unaryMinus = this.matchAndConsume(TokenType.minus);
        if (unaryMinus) {
            let f = this.factor();
            if (f === null) {
                return null;
            }
            return new BNode(TokenType.mult, -1, f);
        }
        switch (peek === null || peek === void 0 ? void 0 : peek.type) {
            case TokenType.openParen:
                this.consume();
                let e = this.expr();
                peek = this.peek();
                if ((peek === null || peek === void 0 ? void 0 : peek.type) !== TokenType.closeParen)
                    return null;
                this.consume();
                return e;
            case TokenType.word:
                if (keywords.includes(peek.lexeme))
                    return null;
                this.consume();
                let name = peek.lexeme;
                peek = this.peek();
                if ((peek === null || peek === void 0 ? void 0 : peek.type) === TokenType.openParen) {
                    let param = this.expr();
                    if (param === null)
                        return null;
                    return new BNode("callFunc", name, param);
                }
                return new BNode("getVar", name);
            case TokenType.integer:
                this.consume();
                return new BNode(TokenType.plus, 0, peek.literal);
            default:
                return null;
        }
    }
    term() {
        let lhs = this.factor();
        if (lhs === null)
            return null;
        let multOrDiv = this.peek();
        let n = new BNode(TokenType.mult, lhs, 1);
        while ((multOrDiv === null || multOrDiv === void 0 ? void 0 : multOrDiv.type) === TokenType.mult ||
            (multOrDiv === null || multOrDiv === void 0 ? void 0 : multOrDiv.type) === TokenType.div) {
            this.consume();
            let f = this.factor();
            if (f === null)
                return null;
            n.rhs = new BNode(multOrDiv.type, n.rhs, f);
            multOrDiv = this.peek();
        }
        return n;
    }
    expr() {
        let lhs;
        lhs = this.term();
        if (lhs === null)
            return null;
        let n = new BNode(TokenType.plus, lhs, 0);
        let plusOrMinus = this.peek();
        while ((plusOrMinus === null || plusOrMinus === void 0 ? void 0 : plusOrMinus.type) === TokenType.plus ||
            (plusOrMinus === null || plusOrMinus === void 0 ? void 0 : plusOrMinus.type) === TokenType.minus) {
            this.consume();
            let t = this.term();
            if (t === null)
                return null;
            n.rhs = new BNode(plusOrMinus.type, n.rhs, t);
            plusOrMinus = this.peek();
        }
        return n;
    }
}
const keywords = [
    "LET",
    "PRINT",
    "REM",
    "END",
    "GOTO",
    "IF",
    "THEN",
    "GOSUB",
    "RETURN",
    "FOR",
    "TO",
    "STEP",
    "NEXT",
];
var TokenType;
(function (TokenType) {
    TokenType["integer"] = "integer";
    TokenType["label"] = "label";
    TokenType["word"] = "word";
    TokenType["less"] = "less";
    TokenType["lessOrEqual"] = "lessOrEqual";
    TokenType["greater"] = "greater";
    TokenType["greaterOrEqual"] = "greaterOrEqual";
    TokenType["notEqual"] = "notEqual";
    TokenType["equal"] = "equal";
    TokenType["plus"] = "plus";
    TokenType["minus"] = "minus";
    TokenType["mult"] = "mult";
    TokenType["div"] = "div";
    TokenType["exp"] = "exp";
    TokenType["openParen"] = "openParen";
    TokenType["closeParen"] = "closeParen";
})(TokenType || (TokenType = {}));
const singleCharacterTokens = {
    "=": TokenType.equal,
    "+": TokenType.plus,
    "-": TokenType.minus,
    "*": TokenType.mult,
    "/": TokenType.div,
    "?": TokenType.exp,
    "(": TokenType.openParen,
    ")": TokenType.closeParen,
};
// Un token représente un bout de code source
// auquel on associe un type,
// le bout de code source en soit (lexeme),
// ainsi que la valeur fixe qu'il représente (literal)
// https://fr.wikipedia.org/wiki/Litt%C3%A9ral_(programmation)
class Token {
    constructor(type, lexeme, literal) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
    }
    asString() {
        return `Token { type : ${this.type}, lexeme : ${this.lexeme}, literal : ${this.literal}}`;
    }
}
function isDigit(c) {
    if (c === null)
        return false;
    return c >= "0" && c <= "9";
}
function isLetter(c) {
    if (c === null)
        return false;
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
}
// Ecrit les arguments dans le div term. 
// Les arguments sont chacun placés dans un nouveau paragraphe.
function bPrint(...args) {
    let termElement = document.getElementById("term");
    args.forEach((arg) => {
        let child;
        if (arg.length > 0) {
            child = document.createElement("p");
            child.textContent = `${arg}`;
        }
        else
            child = document.createElement("br");
        if (termElement === null) {
            console.error("div with id 'term' does not exist");
            return;
        }
        else
            termElement.appendChild(child);
    });
    window.scrollTo(0, document.body.scrollHeight);
}
