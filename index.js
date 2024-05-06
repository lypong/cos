let inputElement=document.getElementById("in");
let input = "";
let p = new Program();

addEventListener("keydown",(event)=>{
    if(event.key==="Backspace")
        input=input.substring(0,input.length-1);
    if(event.key==="Enter"){
        bPrint(input);
        if(input==="RUN")
            p.runProgram();
        else if(input.length>0)
            p.writeLine(input);
        input = "";
    }
    else if(event.key.length===1)
        input+=event.key;
    inputElement.textContent = input;
})