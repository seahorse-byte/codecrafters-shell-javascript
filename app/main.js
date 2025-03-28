const readline = require('readline');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { chdir, cwd } = require('node:process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// function handleEcho(args) {
//   // Filter out empty strings from the initial naive split.
//   // This often happens when multiple spaces are used between arguments.
//   const filteredArgs = args.filter(arg => arg !== '');

//   // Join the filtered arguments with a SINGLE space.
//   const inputString = filteredArgs.join(' ');

//   // Now, apply the character-by-character parsing logic to this cleaned inputString.
//   let result = '';
//   let inSingleQuotes = false;
//   let inDoubleQuotes = false;
//   let escaped = false; // Flag for backslash escape active

//   for (let i = 0; i < inputString.length; i++) {
//     const char = inputString[i];

//     if (escaped) {
//       // Previous char was \ OUTSIDE ANY quotes. Append this char literally.
//       result += char;
//       escaped = false;
//       continue;
//     }

//     // Only treat backslash as an escape character if NOT inside ANY quotes
//     if (char === '\\' && !inSingleQuotes && !inDoubleQuotes) {
//       escaped = true;
//       continue; // Skip appending the backslash for now
//     }

//     // Handle quote state changes (these should not be escaped)
//     if (char === "'") {
//       // If we are not inside double quotes, toggle single quotes
//       if (!inDoubleQuotes) {
//         inSingleQuotes = !inSingleQuotes;
//         continue; // Don't append the quote itself
//       }
//       // If inside double quotes, treat single quote literally (fall through)
//     }
//     if (char === '"') {
//       // If we are not inside single quotes, toggle double quotes
//       if (!inSingleQuotes) {
//         inDoubleQuotes = !inDoubleQuotes;
//         continue; // Don't append the quote itself
//       }
//       // If inside single quotes, treat double quote literally (fall through)
//     }

//     // If we reach here, the char is not an escape sequence start
//     // and not a quote boundary toggle for its context. Append it.
//     result += char;
//   }

//   // If the string ends with an unescaped backslash (outside quotes)
//   // it should be appended literally.
//   if (escaped) {
//     result += '\\';
//   }

//   console.log(result);
// }
// --- End of Updated handleEcho Function ---

// Function to handle the 'type' command
function handleType(args) {
  const [subCommand] = args;

  // Check builtins first
  const builtins = ['echo', 'type', 'exit', 'pwd', 'cd'];
  if (builtins.includes(subCommand)) {
    console.log(`${subCommand} is a shell builtin`);
    return;
  }

  // Check PATH environment variable
  const paths = process.env.PATH.split(path.delimiter);
  let found = false;
  for (const p of paths) {
    // Handle potential empty paths in the PATH variable
    if (!p) continue;
    try {
      const fullPath = path.join(p, subCommand);
      // Check if the file exists and is executable (though fs.existsSync is often sufficient)
      if (fs.existsSync(fullPath)) {
        // Optional: Check execute permissions if needed (more complex across OS)
        // fs.accessSync(fullPath, fs.constants.X_OK);
        console.log(`${subCommand} is ${fullPath}`);
        found = true;
        break; // Stop searching once found
      }
    } catch (err) {
      // Ignore errors like permission denied for certain directories in PATH
      // console.error(`Error accessing path ${p}: ${err.message}`);
    }
  }

  if (!found) {
    console.log(`${subCommand}: not found`);
  }
}

// Recommended code (same as previous response)

function handleEcho(args) {
  // Filter out empty strings from the initial naive split.
  const filteredArgs = args.filter(arg => arg !== '');

  // Join the filtered arguments with a SINGLE space.
  const inputString = filteredArgs.join(' ');

  // Character-by-character parsing logic
  let result = '';
  let inSingleQuotes = false;
  let inDoubleQuotes = false;
  let escaped = false; // Flag for backslash escape active

  for (let i = 0; i < inputString.length; i++) {
    const char = inputString[i];

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === '\\' && !inSingleQuotes && !inDoubleQuotes) {
      escaped = true;
      continue;
    }

    if (char === "'") {
      if (!inDoubleQuotes) {
        inSingleQuotes = !inSingleQuotes;
        continue;
      }
    }
    if (char === '"') {
      if (!inSingleQuotes) {
        inDoubleQuotes = !inDoubleQuotes;
        continue;
      }
    }
    result += char;
  }

  if (escaped) {
    result += '\\';
  }

  console.log(result);
}

// Function to handle the 'pwd' command
function handlePwd() {
  console.log(cwd());
}

// Function to handle the 'cd' command
function handleChDir(args) {
  // Expecting zero or one argument for cd
  const dir = args[0];

  let targetDir;
  if (!dir || dir === '~') {
    // If no argument or tilde, change to home directory
    targetDir = process.env.HOME || process.env.USERPROFILE; // HOME for Unix, USERPROFILE for Windows
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
    // Check the type of error if possible, provide standard message
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

// Function to prompt the user for input
function prompt() {
  rl.question('$ ', answer => {
    // Trim whitespace from the input
    const trimmedAnswer = answer.trim();
    if (trimmedAnswer === '') {
      prompt(); // If empty line, just prompt again
      return;
    }

    // Basic command parsing (splits by space, doesn't handle quotes/escapes during split)
    const [command, ...args] = trimmedAnswer.split(' ');

    // Handle exit command
    if (command === 'exit' && args[0] === '0') {
      process.exit(0);
    }

    switch (command) {
      case 'echo':
        handleEcho(args);
        prompt(); // Call prompt again for next command
        break;
      case 'type':
        handleType(args);
        prompt();
        break;
      case 'pwd':
        handlePwd();
        prompt();
        break;
      case 'cd':
        handleChDir(args); // Pass the arguments array
        prompt();
        break;
      default:
        // Execute external command
        // Reconstruct the command string ensuring args are handled reasonably
        // Note: This simplistic reconstruction might still have issues with complex args containing spaces/quotes
        const fullCmd = [command, ...args].join(' ');
        exec(fullCmd, (error, stdout, stderr) => {
          if (error) {
            // Provide a standard "command not found" type error
            // stderr might contain more specific info, but error.code is often useful
            // e.g., ENOENT for command not found on POSIX systems
            if (
              error.code === 127 ||
              (error.code === 'ENOENT' && error.syscall.includes('spawn'))
            ) {
              console.log(`${command}: command not found`);
            } else {
              // Print stderr if available and seems relevant
              if (stderr) {
                console.error(stderr.trim());
              } else {
                console.error(`exec error: ${error.message}`); // Fallback error
              }
            }
          } else {
            // Print stdout if it's not empty
            if (stdout) {
              console.log(stdout.trim());
            }
            // Print stderr if it's not empty (some commands use stderr for non-error output)
            if (stderr) {
              console.error(stderr.trim());
            }
          }
          prompt(); // Prompt for the next command AFTER execution finishes
        });
        // Don't call prompt() here for exec, it's called in the callback
        break; // Added break statement
    }

    // Removed redundant prompt() call here, it's called within each case or the exec callback
  });
}

// Start the prompt
prompt();
