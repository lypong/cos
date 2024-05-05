function isDigit(c : string) : boolean {
  if(c===null)
    return false;
  return c >= '0' && c <= '9';
}
function isLetter(c : string) : boolean {
  if(c===null)
    return false;
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
}
function bPrint(...args : any[]){
  let termElement=document.getElementById("term");
  args.forEach((arg)=>`${arg}`.split('\n').forEach((l)=>{
      let p = document.createElement("p");
      p.textContent = l;
      if(termElement===null) {
        console.error("div with id 'term' does not exist");
        return;
      } else
        termElement.appendChild(p);
  }))
}
