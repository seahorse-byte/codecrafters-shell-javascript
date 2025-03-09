const readline = require('readline');
const { exec } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function isBuiltin(command, callback) {
  exec(`type ${command}`, (error, stdout, stderr) => {
    if (error) {
      // Command not found or other error
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

      if (command === 'echo') {
        console.log(args.join(' '));
      } else if (command === 'type') {
        const [subCommand] = args;
        isBuiltin(subCommand, isBuiltIn => {
          console.log(
            isBuiltIn
              ? `${subCommand} is a shell builtin`
              : `${subCommand} not found`,
          );
        });
      } else {
        console.log(`${answer}: command not found`);
      }

      prompt();
    }
  });
}

prompt();
