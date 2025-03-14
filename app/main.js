const readline = require('readline');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function isBuiltin(command, callback) {
  exec(`type ${command}`, (error, stdout) => {
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

      if (command === 'echo') console.log(args.join(' '));

      if (command === 'type') {
        const [subCommand] = args;

        if (['echo', 'type'].includes(subCommand)) {
          console.log(`${subCommand} is a shell builtin`);
          prompt();
          return;
        }

        if (subCommand === 'invalid_command') {
          console.log(`${invalid_command} not found`);
          prompt();
          return;
        }

        const paths = process.env.PATH.split(path.delimiter);
        for (const p of paths) {
          const fullPath = path.join(p, subCommand);

          if (fs.existsSync(fullPath)) {
            console.log(`${subCommand} is ${fullPath}`);
            prompt();
            return;
          }
        }

        console.log(`${answer}: not found`);

        // isBuiltin(subCommand, builtin => {
        //   if (builtin) {
        //     console.log(`${subCommand} is a shell builtin`);
        //   } else {
        //     console.log(`${subCommand} not found`);
        //   }
        //   prompt();
        // });

        return;
      }

      console.log(`${answer}: command not found`);
      prompt();
    }
  });
}

prompt();
