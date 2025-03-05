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
      console.log(`${answer}: command not found`);
      prompt();
    }
  });    
}

prompt();