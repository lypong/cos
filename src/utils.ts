function isDigit(c: string): boolean {
  if (c === null) return false;
  return c >= "0" && c <= "9";
}
function isLetter(c: string): boolean {
  if (c === null) return false;
  return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
}
function bPrint(...args: any[]) {
  let termElement = document.getElementById("term");
  args.forEach((arg) => {
    let child;
    if (arg.length > 0) {
      child = document.createElement("p");
      child.textContent = `${arg}`;
    } else child = document.createElement("br");
    if (termElement === null) {
      console.error("div with id 'term' does not exist");
      return;
    } else termElement.appendChild(child);
  });
  window.scrollTo(0, document.body.scrollHeight);
}
