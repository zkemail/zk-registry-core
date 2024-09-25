import { ChildProcess, spawn } from 'child_process';

export function execCmd(command: string, input?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parts = command.match(/(?:[^\s"]+|"[^"]*")+/g);
    if (!parts) {
      reject(new Error('Invalid command'));
      return;
    }
    const [cmd, ...args] = parts.map((part) => part.replace(/"/g, ''));
    const childProcess: ChildProcess = spawn(cmd, args);

    let stdout = '';
    let stderr = '';

    childProcess.stdout?.on('data', (data) => {
      stdout += data.toString();
      if (!data.includes('DEBUG')) {
        console.log(`stdout: ${data}`);
      }
    });

    childProcess.stderr?.on('data', (data) => {
      stderr += data.toString();
      console.error(`stderr: ${data}`);
    });

    childProcess.on('error', (error) => {
      reject(new Error(`Failed to start subprocess: ${error.message}`));
    });

    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });

    if (input) {
      setTimeout(() => {
        childProcess.stdin?.write(input + '\n');
        childProcess.stdin?.end();
      }, 100); // Wait for 1 second before sending input
    }
  });
}
