const readline = require('readline');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

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

      let found = false;

      if (command === 'echo') {
        console.log(args.join(' '));
      } else if (command === 'type') {
        const [subCommand] = args;

        for (const p of paths) {
          const fullPath = path.join(p, subCommand);
          console.log(
            'fs.statSync(fullPath).isFile()',
            fs.statSync(fullPath).isFile(),
          );

          if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            console.log('Is file');
            console.log(`${subCommand} is ${fullPath}`);
            prompt();
            return;
          }

          if (!found) {
            console.log(`${subCommand} not found`);
            prompt();
            return;
          }

          // if (fullPath) {
          //   isBuiltin(fullPath, builtin => {
          //     if (builtin) {
          //       console.log(`${fullPath} is a shell builtin`);
          //     } else {
          //       console.log(`${fullPath} not found`);
          //     }
          //     prompt();
          //   });

          //   return;
          // }
        }
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
