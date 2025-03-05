const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt() {
  rl.question("$ ", (answer) => {
    if (answer === "exit") {
      rl.close();
    } else {
      console.log(`${answer}: command not found`);
      prompt();
    }
  });    
}

prompt();