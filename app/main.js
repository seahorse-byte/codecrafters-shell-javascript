const readline = require('readline');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { chdir, cwd } = require('node:process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// --- New Echo Handler: Parses the raw argument string ---
function parseAndEchoArguments(fullArgString) {
  let resultArgs = []; // Array to hold the final processed arguments
  let currentArg = ''; // Builds the current argument piece by piece
  let inSingleQuotes = false;
  let inDoubleQuotes = false;
  let escaped = false;

  for (let i = 0; i < fullArgString.length; i++) {
    const char = fullArgString[i];

    // 1. Handle escaped characters
    if (escaped) {
      currentArg += char; // Append the escaped character literally
      escaped = false;
      continue;
    }

    // 2. Check for escape character trigger (only outside quotes)
    if (char === '\\' && !inSingleQuotes && !inDoubleQuotes) {
      escaped = true; // Set flag for the next character
      continue; // Don't append the backslash now
    }

    // 3. Handle quote state changes
    if (char === "'" && !inDoubleQuotes) {
      inSingleQuotes = !inSingleQuotes;
      continue; // Don't append the quote character itself.
    }
    if (char === '"' && !inSingleQuotes) {
      inDoubleQuotes = !inDoubleQuotes;
      continue; // Don't append the quote character itself
    }

    // 4. Handle argument separation (space outside quotes)
    if (char === ' ' && !inSingleQuotes && !inDoubleQuotes) {
      // If we have gathered something for the current argument, push it.
      if (currentArg.length > 0) {
        resultArgs.push(currentArg);
        currentArg = ''; // Reset for the next argument
      }
      // Ignore the space itself (this naturally collapses multiple spaces BETWEEN args)
      continue;
    }

    // 5. Append character to current argument
    // This catches:
    // - Regular characters
    // - Spaces inside quotes
    // - Backslashes inside quotes (as escape check failed)
    // - Quotes inside the other type of quotes
    currentArg += char;
  }

  // After the loop, push any remaining content as the last argument
  if (currentArg.length > 0) {
    resultArgs.push(currentArg);
  }

  // Join the processed arguments with a single space for the final output
  console.log(resultArgs.join(' '));
}

// Function to handle the 'type' command (no changes needed)
function handleType(args) {
  const [subCommand] = args;
  const builtins = ['echo', 'type', 'exit', 'pwd', 'cd'];
  if (builtins.includes(subCommand)) {
    console.log(`${subCommand} is a shell builtin`);
    return;
  }
  const paths = process.env.PATH.split(path.delimiter);
  let found = false;
  for (const p of paths) {
    if (!p) continue;
    try {
      const fullPath = path.join(p, subCommand);
      if (fs.existsSync(fullPath)) {
        console.log(`${subCommand} is ${fullPath}`);
        found = true;
        break;
      }
    } catch (err) {
      /* Ignore errors */
    }
  }
  if (!found) {
    console.log(`${subCommand}: not found`);
  }
}

// Function to handle the 'pwd' command (no changes needed)
function handlePwd() {
  console.log(cwd());
}

// Function to handle the 'cd' command (no changes needed)
function handleChDir(args) {
  const dir = args[0];
  let targetDir;
  if (!dir || dir === '~') {
    targetDir = process.env.HOME || process.env.USERPROFILE;
    if (!targetDir) {
      console.error(`cd: HOME directory not set`);
      return;
    }
  } else {
    targetDir = dir;
  }
  try {
    chdir(targetDir);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`cd: ${targetDir}: No such file or directory`);
    } else if (err.code === 'ENOTDIR') {
      console.error(`cd: ${targetDir}: Not a directory`);
    } else {
      console.error(
        `cd: Error changing directory to ${targetDir}: ${err.message}`,
      );
    }
  }
}

// --- Modified Prompt Function ---
function prompt() {
  rl.question('$ ', answer => {
    const trimmedAnswer = answer.trim();
    if (trimmedAnswer === '') {
      prompt(); // If empty line, just prompt again
      return;
    }

    // Use simple split mainly to identify the command easily
    // and for commands that don't need complex parsing (type, cd, potentially exec)
    const [command, ...args] = trimmedAnswer.split(' ');

    // --- Prepare arguments based on command ---
    let fullArgString = ''; // For echo
    if (command === 'echo') {
      const firstSpaceIndex = trimmedAnswer.indexOf(' ');
      if (firstSpaceIndex !== -1) {
        // Extract everything after the first space
        fullArgString = trimmedAnswer.substring(firstSpaceIndex + 1);
      }
      // If no space (e.g., just 'echo'), fullArgString remains ''
    }

    // Handle exit command
    if (command === 'exit' && args[0] === '0') {
      process.exit(0);
    }

    switch (command) {
      case 'echo':
        // Pass the raw argument string to the new parser/handler
        parseAndEchoArguments(fullArgString);
        prompt(); // Call prompt again for next command
        break;
      case 'type':
        handleType(args); // Use simple split args
        prompt();
        break;
      case 'pwd':
        handlePwd(); // No args needed
        prompt();
        break;
      case 'cd':
        handleChDir(args); // Use simple split args
        prompt();
        break;
      default:
        // Execute external command
        // Sticking with simple reconstruction. A full parser would be needed here too ideally.
        const fullCmd = trimmedAnswer; // Use trimmed answer directly for exec? Might be safer.
        exec(fullCmd, (error, stdout, stderr) => {
          if (error) {
            if (
              error.code === 127 ||
              (error.code === 'ENOENT' && error.syscall?.includes('spawn'))
            ) {
              console.log(`${command}: command not found`);
            } else {
              if (stderr && stderr.trim()) {
                console.error(stderr.trim());
              }
              // Avoid printing generic exec errors if stderr likely contained the info
              else if (!stderr?.trim() && error.message) {
                console.error(`exec error: ${error.message}`);
              }
            }
          } else {
            if (stdout && stdout.trim()) {
              console.log(stdout.trim());
            }
            if (stderr && stderr.trim()) {
              console.error(stderr.trim());
            }
          }
          prompt();
        });
        break;
    }
  });
}

// Start the prompt
prompt();
