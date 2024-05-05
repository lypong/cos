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
function bPrint(...args){
  console.log(...args);
}
