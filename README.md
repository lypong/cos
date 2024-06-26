# Cool old scripting

COS est un site web imitant le style des premiers ordinateurs personnels il comporte un interpréteur pour mon dialecte personnel de basic basé sur la version de dartmouth et écrit en typescript.
Il a été rédigé pendant mon temps libre sur plusieures semaines, petit à petit. D'abord en javascript puis en typescript pour une implémentation plus robuste, moins sujette à des erreurs de runtime. Éviter ces erreurs était la principale difficulté rencontrée dans ce projet.
pour fonctionner le projet doit être transpilé en javascript avec les commandes suivantes (veillez à installer le paquet `typescript` globalement avec `npm` ou `yarn` au préalable)

```bash
cd chemin/vers/projet
tsc
```

## Commandes

Les commandes sont les suivantes : `RUN` et `LIST`.
`LIST` affiche la source du programme à exécuter.
`RUN` lance le programme.

## Instructions (statements)

Chaque ligne écrite doit comporter un numéro suivi d'une instructions et des ses arguments. Par exemple

```basic
10 PRINT "Hello world"
```

Les instructions supportées dans COS sont les suivantes :

- PRINT (attention son fonctionnement diffère de dartmouth basic)
- LET
- END (attention son fonctionnement diffère de dartmouth basic)
- RETURN
- GOSUB
- GOTO
- FOR
- NEXT
- REM

## Différences majeures avec dartmouth basic

- Les identifiant peuvent comporter plusieures lettres majuscules et minuscules, des chiffres (sauf le premier caractère) et des \_ .
- L'opérateur ^ de puissance n'est pas supporté, il peut toutefois être subsitué par une boucle.
- Il peut y avoir plusieurs END dans un programme, pas forcément à la fin.
- L'aritméthique à virgules flottantes est supportée mais les littéraux numériques doivent représenter des entiers.
- PRINT prends au maximum un label (par exemple "hello world") et une expression strictement dans cet ordre. Si l'utilisateur veut afficher plusieures choses, il doit utiliser plusieurs PRINT.

[documentation originale de dartmouth basic](https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://ia601901.us.archive.org/34/items/bitsavers_dartmouthB_3679804/BASIC_4th_Edition_Jan68_text.pdf&ved=2ahUKEwiPzqCFvo2GAxUB9AIHHWqtB9YQFnoECC4QAQ&usg=AOvVaw3fizFRoHowshdpbrjspwLb)
