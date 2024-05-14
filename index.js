let inputElement = document.getElementById("in");
let input = "";
let p = new Program();

addEventListener("keydown", (event) => {
  // On supprime un caractère si on appuie sur la touche effacer.
  if (event.key === "Backspace") input = input.substring(0, input.length - 1);

  // On fait un retour à la ligne si on appuie sur la touche entrer.
  // Puis on regarde si l'input est une commande
  // ou une ligne à écrire dans la source.
  if (event.key === "Enter") {
    bPrint(input);
    try {
      if (input === "RUN") p.runProgram();
      else if (input === "LIST") p.listLines();
      else if (input.length > 0) p.writeLine(input);
    } catch (e) {
      p.crash(e.message);
    }
    input = "";
  } else if (event.key.length === 1) input += event.key;
  inputElement.textContent = input;
});
