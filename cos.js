const FILE = "File";
const DIRECTORY = "Directory";
class File {
  constructor(name,data){
    this.type = FILE;
    this.name = name;
    this.data = data;
  }
}
class Directory {
  constructor(name,children){
    this.type = DIRECTORY;
    this.name = name;
    this.children = children;
  }
}
function maxFileSizeInDirectory(dir){
  let max = 0;
  dir.children.forEach((e)=>{
    if(e.type===FILE && e.data.length > max) max = e.data.length;
  });
  return max;
}
function characterRepetition(c,n){
  let res = "";
  for(let i = 0; i < n; i++){
    res+=c;
  }
  return res;
}
function numberOfDigits(n){
  return Math.floor(Math.log10(n))+1;
}
function getDirectSubDirectory(dir,name){
  for(subDir of dir.children){
    if(subDir.type!==DIRECTORY) continue;
    if(subDir.name===name) return subDir;
  }
  return null;
}
function getCurrentWorkingDirectoryPath(){
  return "/"+cwdPath.join("/");
}
function dir(...path){
    let oldPath = getCurrentWorkingDirectoryPath();
    if(path.length>0)
      chdir(path.join(""));
    let maxFileSize = maxFileSizeInDirectory(fs);
    let maxNumberOfDigits = numberOfDigits(maxFileSize);
    console.log(`Directory of Z:${getCurrentWorkingDirectoryPath()}.`)
    cwd.children.forEach((e)=>{
      switch (e.type) {
        case FILE:
          console.log(`      ${characterRepetition(' ',maxNumberOfDigits-numberOfDigits(e.data.length))}${e.data.length} ${e.name}`);
          break;
        case DIRECTORY:
          console.log(`<DIR> ${characterRepetition(' ',maxNumberOfDigits)} ${e.name}`);
          break;

        default:
          break;
      }
    });
    if(path.length>0) 
      chdir(oldPath);
}
function mkdir(...argname) {
  let name = argname.join("");
  let parentDir = new Directory("..",cwd.children);
  if(cwd.children.some((e)=>e.name===name)){
    console.log(`${name} already exists.`);
    return;
  }
  cwd.children.push(new Directory(name,[parentDir]));
}

function chdir(...argpath) {
  let path = argpath.join("");
  let isAbsolute = path[0]==='/';
  let startingPoint = cwd;
  let tempPath
  if(isAbsolute) {startingPoint = fs;tempPath = [];}
  else tempPath = cwdPath.copyWithin();
  let accumulator = "";
  for(c of path) {
    if(c===' ') continue;
    if(c==='/') {
        if(accumulator.length>0){
        startingPoint = getDirectSubDirectory(startingPoint,accumulator);
        if(startingPoint===null) {
          console.log(`DIR ${path} NOT FOUND.`);
          return;
        }
        if(accumulator!=="..")
          tempPath.push(accumulator);
        else
          tempPath.pop();
        accumulator="";
        }
      continue;
    }
    accumulator+=c;
  }
  if(accumulator.length > 0) {
    startingPoint = getDirectSubDirectory(startingPoint,accumulator);
    if(startingPoint===null) {
      console.log(`DIR ${path} NOT FOUND.`);
      return;
    }
    if(accumulator!=="..")
      tempPath.push(accumulator);
    else
      tempPath.pop();  }
  cwd = startingPoint;
  cwdPath = tempPath;
}

const commands = {
  "DIR":dir,
  "MKDIR":mkdir,
  "MD":mkdir,
  "CHDIR":chdir,
  "CD":chdir,
};

function eval(command){
  console.log(`Z:${getCurrentWorkingDirectoryPath()}>`,command);
  let splitted = command.toUpperCase().split(" ");
  let f = splitted[0];
  let args = splitted.splice(1);
  commands[f](...args);
}

let fs = new Directory("/",[new File("HI","hey")]);
let cwd = fs;
let cwdPath = [];

mkdir("HELLO");
eval("mkdir yo b");
eval("dir");
eval("CD yob/");
eval("mkdir b");
eval("mkdir b");
eval("CD b");

eval("CD ../..");
eval("CD yob/hi");
eval("DIR /");
