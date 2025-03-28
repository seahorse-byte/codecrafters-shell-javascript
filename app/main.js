const readline = require('readline');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { chdir, cwd } = require('node:process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function handleEcho(args) {
  // Join the arguments into a single string
  const inputString = args.join(' ');

  // Match single-quoted strings, double-quoted strings, or unquoted sequences
  const echoArgs = inputString.match(/'[^']*'|"[^"]*"|[^ ]+/g);

  if (echoArgs) {
    echoArgs.forEach((item, index, arr) => {
      if (item.startsWith('"') && item.endsWith('"')) {
        // Remove surrounding double quotes and handle escaped characters
        arr[index] = item.slice(1, -1).replace(/\\(.)/g, '$1'); // Interpret backslashes as escape characters
      } else if (item.startsWith("'") && item.endsWith("'")) {
        // Remove surrounding single quotes (no escape handling inside single quotes)
        arr[index] = item.slice(1, -1);
      } else {
        // Handle backslashes for unquoted tokens, including escaped spaces
        arr[index] = item.replace(/\\(.)/g, '$1');
      }
    });

    console.log(echoArgs.join(' '));
  } else {
    // If no matches, handle backslashes in the input string
    console.log(inputString.replace(/\\(.)/g, '$1'));
  }
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
    if (dir === '~') {
      chdir(process.env.HOME);
      return;
    }
    chdir(dir);
  } catch (err) {
    console.error(`cd: /non-existing-directory: No such file or directory`);
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
