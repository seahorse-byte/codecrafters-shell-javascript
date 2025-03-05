const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt() {
  rl.question("$ ", (answer) => {
    if (answer === "exit 0") {
      process.exit(0);
    } else {
      const [command, ...args] = answer.split(" ");
      if (command === "echo") {
        console.log(args.join(" "));
      } 
      // else if (command === "cat") {
      //   const fs = require("fs");
      //   const file = args[0];
      //   fs.readFile(file, "utf8", (err, data) => {
      //     if (err) {
      //       console.log(err);
      //     } else {
      //       console.log(data);
      //     }
      //     prompt();
      //   });
      //   return;
      // } else if (command === "ls") {
      //   const fs = require("fs");
      //   fs.readdir(".", (err, files) => {
      //     if (err) {
      //       console.log(err);
      //     } else {
      //       console.log(files.join(" "));
      //     }
      //     prompt();
      //   });
      //   return;
      // } else if (command === "pwd") {
      //   console.log(process.cwd());
      // } else {
      //   console.log(`${command}: command not found`);
      // }
      // console.log(`${answer}: command not found`);
      prompt();
    }
  });    
}

prompt();