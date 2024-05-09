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
