const readline = require('readline');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to check if a command is a shell builtin
function isBuiltin(command, callback) {
  exec(`type ${command}`, (error, stdout) => {
    if (error) {
      callback(false);
      return;
    }
    callback(stdout.includes('builtin'));
  });
}

// Function to handle the 'echo' command
function handleEcho(args) {
  console.log(args.join(' '));
}

// Function to handle the 'type' command
function handleType(args) {
  const [subCommand] = args;

  if (['echo', 'type', 'exit'].includes(subCommand)) {
    console.log(`${subCommand} is a shell builtin`);
    return;
  }

  const paths = process.env.PATH.split(path.delimiter);
  for (const p of paths) {
    const fullPath = path.join(p, subCommand);

    if (fs.existsSync(fullPath)) {
      console.log(`${subCommand} is ${fullPath}`);
      return;
    }
  }

  console.log(`${subCommand}: not found`);
}

// Function to prompt the user for input
function prompt() {
  rl.question('$ ', answer => {
    if (answer === 'exit 0') {
      process.exit(0);
    }

    const [command, ...args] = answer.split(' ');

    switch (command) {
      case 'echo':
        handleEcho(args);
        break;
      case 'type':
        handleType(args);
        break;
      default:
        console.log(`${command}: command not found`);
        break;
    }

    prompt(); // Continue prompting for the next command
  });
}

// Start the prompt
prompt();
