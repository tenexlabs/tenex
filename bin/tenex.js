#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const args = process.argv.slice(2);
const command = args[0];

// ANSI color codes
const GRAY = '\x1b[90m';
const RESET = '\x1b[0m';

// Helper function to prompt for user input with default value shown as placeholder
function prompt(question, defaultValue = '') {
  return new Promise((resolve) => {
    // Write the prompt with gray placeholder
    const placeholder = defaultValue ? GRAY + defaultValue + RESET : '';
    process.stdout.write(`${question}: ${placeholder}`);
    
    let input = '';
    let showingPlaceholder = defaultValue !== '';
    
    // Save original raw mode state
    const wasRaw = process.stdin.isRaw;
    
    // Resume stdin if it was paused
    if (process.stdin.isPaused()) {
      process.stdin.resume();
    }
    
    // Set raw mode to capture individual keystrokes
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    
    // Cleanup function
    const cleanup = () => {
      process.stdin.removeListener('data', onData);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(wasRaw);
      }
      // Pause stdin to prevent it from staying open
      if (!process.stdin.isPaused()) {
        process.stdin.pause();
      }
    };
    
    // Handle data events
    const onData = (data) => {
      const char = data.toString();
      
      // Handle Enter/Return
      if (char === '\r' || char === '\n') {
        cleanup();
        process.stdout.write('\n');
        resolve(input || defaultValue);
        return;
      }
      
      // Handle backspace/delete
      if (char === '\b' || char === '\x7f' || char === '\x08') {
        if (input.length > 0) {
          input = input.slice(0, -1);
          process.stdout.write('\b \b');
        } else if (showingPlaceholder) {
          // Clear placeholder
          showingPlaceholder = false;
          // Erase placeholder text by moving back, writing spaces, moving back again
          const erase = '\b'.repeat(defaultValue.length) + ' '.repeat(defaultValue.length) + '\b'.repeat(defaultValue.length);
          process.stdout.write(erase);
        }
        return;
      }
      
      // Handle Ctrl+C
      if (char === '\x03') {
        cleanup();
        process.stdout.write('\n');
        process.exit(0);
        return;
      }
      
      // Handle printable characters
      if (char.length === 1 && char.charCodeAt(0) >= 32 && char.charCodeAt(0) < 127) {
        if (showingPlaceholder) {
          // Clear placeholder first
          showingPlaceholder = false;
          const erase = '\b'.repeat(defaultValue.length) + ' '.repeat(defaultValue.length) + '\b'.repeat(defaultValue.length);
          process.stdout.write(erase);
        }
        input += char;
        process.stdout.write(char);
      }
    };
    
    process.stdin.on('data', onData);
  });
}

// Helper function to run a command
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    process.on('error', (error) => {
      reject(error);
    });
    
    process.on('exit', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

if (command === 'init') {
  // Run commands sequentially
  (async () => {
    try {
      // Get project name from argument or prompt
      let projectName = args[1];
      
      if (!projectName) {
        projectName = await prompt('Project name', 'my-app');
        if (!projectName) {
          console.error('Project name is required');
          process.exit(1);
        }
      }
      
      // Validate project name (basic check)
      if (!/^[a-z0-9-]+$/i.test(projectName)) {
        console.error('Project name can only contain letters, numbers, and hyphens');
        process.exit(1);
      }
      
      // Check if directory already exists
      const projectDir = path.join(process.cwd(), projectName);
      if (fs.existsSync(projectDir)) {
        console.error(`Directory "${projectName}" already exists`);
        process.exit(1);
      }
      
      // Run: npm create convex@latest <project-name> -- -t tanstack-start
      console.log(`Creating convex project "${projectName}" with tanstack-start template...`);
      await runCommand('npm', ['create', 'convex@latest', projectName, '--', '-t', 'tanstack-start']);
      
      // Verify the directory was created and has package.json
      if (!fs.existsSync(projectDir)) {
        throw new Error(`Project directory not found: ${projectDir}`);
      }
      
      const packageJsonPath = path.join(projectDir, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`package.json not found in ${projectDir}`);
      }
      
      // Run: npx vibe-rules install cursor (inside project directory)
      console.log('Installing vibe-rules for cursor...');
      await runCommand('npx', ['vibe-rules', 'install', 'cursor'], {
        cwd: projectDir
      });
      
      console.log('\n✓ Setup complete!');
      
      // Ensure clean exit
      process.exit(0);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();
} else if (command) {
  console.error(`Unknown command: ${command}`);
  console.error('Usage: tenex init [project-name]');
  process.exit(1);
} else {
  console.error('Usage: tenex init [project-name]');
  process.exit(1);
}