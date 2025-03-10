const readline = require('readline');
const { exec } = require('child_process');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function isBuiltin(command, callback) {
  exec(`type ${command}`, (error, stdout, stderr) => {
    if (error) {
      callback(false);
      return;
    }

    if (stdout.includes('builtin')) {
      callback(true);
    } else {
      callback(false);
    }
  });
}

function prompt() {
  rl.question('$ ', answer => {
    if (answer === 'exit 0') {
      process.exit(0);
    } else {
      const [command, ...args] = answer.split(' ');

      const paths = process.env.PATH.split(path.delimiter);

      for (const p of paths) {
        const fullPath = path.join(p, command);
        if (fullPath) {
          isBuiltin(subCommand, builtin => {
            if (builtin) {
              console.log(`${subCommand} is a shell builtin`);
            } else {
              console.log(`${subCommand} not found`);
            }
            prompt();
          });

          return;
        }
      }

      if (command === 'echo') {
        console.log(args.join(' '));
      } else if (command === 'type') {
        const [subCommand] = args;
        isBuiltin(subCommand, builtin => {
          if (builtin) {
            console.log(`${subCommand} is a shell builtin`);
          } else {
            console.log(`${subCommand} not found`);
          }
          prompt();
        });
        return;
      } else {
        console.log(`${answer}: command not found`);
      }

      prompt();
    }
  });
}

prompt();
