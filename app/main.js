const readline = require('readline');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { chdir, cwd } = require('node:process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to handle the 'echo' command
function handleEcho(args) {
  console.log(args.join(' '));
}

// Function to handle the 'type' command
function handleType(args) {
  const [subCommand] = args;

  if (['echo', 'type', 'exit', 'pwd'].includes(subCommand)) {
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

// Function to handle the 'pwd' command
function handlePwd() {
  console.log(cwd());
}

// Function to handle the 'cd' command
function handleChDir(dir) {
  // cd without arguments should change to the home directory
  try {
    chdir(dir);
  } catch (err) {
    console.error(`cd: ${cwd()}: No such file or directory`);
  }
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
      case 'pwd':
        handlePwd();
        break;
      case 'cd':
        handleChDir(args[0]);
        break;
      default:
        exec(`${command} ${args.join(' ')}`, (error, stdout, stderr) => {
          if (error) {
            console.error(`${command}: command not found`);
          } else {
            console.log(stdout.trim());
            if (stderr) {
              console.error(stderr.trim());
            }
          }
          prompt();
        });
        return;
    }

    prompt();
  });
}

// Start the prompt
prompt();
