const readline = require('readline');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { chdir, cwd } = require('node:process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// General argument parser: Parses a raw argument string into an array of arguments
function parseArguments(fullArgString) {
  let resultArgs = []; // Array to hold the final processed arguments
  let currentArg = ''; // Builds the current argument piece by piece
  let inSingleQuotes = false;
  let inDoubleQuotes = false;
  let escaped = false; // True if the previous char was a relevant backslash

  for (let i = 0; i < fullArgString.length; i++) {
    const char = fullArgString[i];

    // 1. Handle escaped characters
    if (escaped) {
      currentArg += char; // Append the escaped character literally
      escaped = false;
      continue;
    }

    // 2. Handle backslash inside double quotes (special escaping rules)
    if (char === '\\' && inDoubleQuotes) {
      // Look ahead to see what the next character is
      const nextChar = fullArgString[i + 1];

      // Inside double quotes, backslash only escapes: " \\ $ ` \n
      // For this stage, we're implementing: \" and \\
      if (nextChar === '"' || nextChar === '\\') {
        // This backslash is an escape character
        escaped = true;
        continue; // Skip the backslash, next iteration will handle the escaped char
      }
      // If nextChar is not escapable, the backslash is literal
      // Just append it and continue
      currentArg += char;
      continue;
    }

    // 3. Check for escape character trigger (only outside quotes)
    if (char === '\\' && !inSingleQuotes && !inDoubleQuotes) {
      escaped = true; // Set flag for the next character
      continue; // Don't append the backslash now
    }

    // 4. Handle quote state changes
    if (char === "'" && !inDoubleQuotes) {
      inSingleQuotes = !inSingleQuotes;
      continue; // Don't append the quote character itself
    }
    if (char === '"' && !inSingleQuotes) {
      inDoubleQuotes = !inDoubleQuotes;
      continue; // Don't append the quote character itself
    }

    // 5. Handle argument separation (space outside quotes)
    if (char === ' ' && !inSingleQuotes && !inDoubleQuotes) {
      // If we have gathered something for the current argument, push it.
      if (currentArg.length > 0) {
        resultArgs.push(currentArg);
        currentArg = ''; // Reset for the next argument
      }
      // Ignore the space itself (this naturally collapses multiple spaces BETWEEN args)
      continue;
    }

    // 6. Append character to current argument
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

  return resultArgs;
}

// Echo Handler: Uses the general parser and prints the result
function parseAndEchoArguments(fullArgString) {
  const resultArgs = parseArguments(fullArgString);
  console.log(resultArgs.join(' '));
}

// Helper function to escape arguments for shell execution
function escapeShellArg(arg) {
  // If the argument contains special characters, wrap it in single quotes
  // and escape any single quotes within it
  if (/[\s"'$`\\*?\[\](){};<>|&!~]/.test(arg)) {
    return "'" + arg.replace(/'/g, "'\\''") + "'";
  }
  return arg;
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
      // Check if file exists AND is executable
      if (fs.existsSync(fullPath)) {
        try {
          fs.accessSync(fullPath, fs.constants.X_OK);
          // File is executable
          console.log(`${subCommand} is ${fullPath}`);
          found = true;
          break;
        } catch {
          // File exists but is not executable, continue searching
        }
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

    // Parse environment variable assignments and extract command
    // Format: VAR=value VAR2=value2 command args
    const envVars = {};
    let remainingInput = trimmedAnswer;

    // Extract environment variable assignments (VAR=value before the command)
    while (true) {
      const match = remainingInput.match(/^(\w+)=([^\s]+)\s+/);
      if (match) {
        envVars[match[1]] = match[2];
        remainingInput = remainingInput.substring(match[0].length);
      } else {
        break;
      }
    }

    // Extract command and full argument string from remaining input
    const firstSpaceIndex = remainingInput.indexOf(' ');
    let command, fullArgString;

    if (firstSpaceIndex === -1) {
      // No arguments, just a command
      command = remainingInput;
      fullArgString = '';
    } else {
      // Split into command and everything after first space
      command = remainingInput.substring(0, firstSpaceIndex);
      fullArgString = remainingInput.substring(firstSpaceIndex + 1);
    }

    // Temporarily set environment variables for this command
    const originalEnv = {};
    for (const [key, value] of Object.entries(envVars)) {
      originalEnv[key] = process.env[key];
      process.env[key] = value;
    }

    // Parse arguments using our general parser (handles quotes and escapes)
    const args = parseArguments(fullArgString);

    // Helper to restore environment after command execution
    const restoreEnv = () => {
      for (const [key, value] of Object.entries(originalEnv)) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    };

    // Handle exit command
    if (command === 'exit' && args[0] === '0') {
      process.exit(0);
    }

    switch (command) {
      case 'echo':
        // Pass the raw argument string to the new parser/handler
        parseAndEchoArguments(fullArgString);
        restoreEnv();
        prompt(); // Call prompt again for next command
        break;
      case 'type':
        handleType(args);
        restoreEnv();
        prompt();
        break;
      case 'pwd':
        handlePwd(); // No args needed
        restoreEnv();
        prompt();
        break;
      case 'cd':
        handleChDir(args);
        restoreEnv();
        prompt();
        break;
      default:
        const escapedArgs = args.map(escapeShellArg).join(' ');
        const fullCmd = escapedArgs ? `${command} ${escapedArgs}` : command;
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
          restoreEnv();
          prompt();
        });
        break;
    }
  });
}

// Start the prompt
prompt();
