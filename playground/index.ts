import { ChildProcess, exec as execCallback, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import * as crypto from 'crypto';

const exec = promisify(execCallback);

function execCmd(command: string, input?: string): Promise<string> {
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

async function main() {
  try {
    await compileCircuits();
    await computeWitness();
    await powersOfTau();
    await phase2();
  } catch (err) {
    console.error('Err in main: ', err);
  }
}

async function compileCircuits() {
  const circuitPath = './multiplier.circom';
  const outputDir = './output';
  const nodeModulesDir = './node_modules';

  const circumOutput = await execCmd(
    `circom ${circuitPath} --r1cs --wasm --sym -o ${outputDir} -l ${nodeModulesDir}`,
  );
  console.log('circumOutput : ', circumOutput);
}

async function computeWitness() {
  // Create input.json
  const inputs = JSON.stringify({
    a: '3',
    b: '11',
  });
  const inputFile = './output/multiplier_js/input.json';
  await fs.writeFile(inputFile, inputs);

  // compute witness
  let generateWitnessFile = './output/multiplier_js/generate_witness.js';

  // rename js to cjs for node to work
  // const generateWitnessFileCjs = './output/multiplier_js/generate_witness.cjs';
  // console.log('renaming');
  // await fs.rename(generateWitnessFile, generateWitnessFileCjs);
  // generateWitnessFile = generateWitnessFileCjs;

  const wasmFile = './output/multiplier_js/multiplier.wasm';
  const resultWitnessFile = './output/witness.wtns';
  const generateWitnessOutput = await execCmd(
    `bun ${generateWitnessFile} ${wasmFile} ${inputFile} ${resultWitnessFile}`,
  );
  console.log('generateWitnessOutput : ', generateWitnessOutput);
}

// Do this, then generate contract, deploy
async function powersOfTau() {
  const tauFile1 = './output/pot12_0000.ptau';
  const tauFile2 = './output/pot12_0001.ptau';

  await execCmd(`snarkjs powersoftau new bn128 12 ${tauFile1} -v`);
  console.log('generated tauFile1');

  const randomEntropy = crypto.randomBytes(32).toString('hex');
  console.log('randomEntropy: ', randomEntropy);

  await execCmd(
    `snarkjs powersoftau contribute ${tauFile1} ${tauFile2} --name="First contribution" -v`,
    randomEntropy,
  );
  console.log('generated tauFile2');
}

async function phase2() {
  const tauFile2 = './output/pot12_0001.ptau';
  const tauFileFinal = './output/pot12_final.ptau';
  const r1csFile = './output/multiplier.r1cs';
  const zkeyFile1 = './output/multiplier_0000.zkey';
  const zkeyFile2 = './output/multiplier_0001.zkey';
  const verificationKeyFile = './output/verification_key.json';
  console.log('phase2 1');
  //The phase 2 is circuit-specific. Execute the following command to start the generation of this phase:
  await execCmd(
    `snarkjs powersoftau prepare phase2 ${tauFile2} ${tauFileFinal} -v`,
  );

  console.log('phase2 2');
  // Next, we generate a .zkey file that will contain the proving and verification keys together with all phase 2 contributions. Execute the following command to start a new zkey:
  await execCmd(
    `snarkjs groth16 setup ${r1csFile} ${tauFileFinal} ${zkeyFile1}`,
  );

  const randomEntropy = crypto.randomBytes(32).toString('hex');
  console.log('phase2 3');
  // Contribute to the phase 2 of the ceremony:
  await execCmd(
    `snarkjs zkey contribute ${zkeyFile1} ${zkeyFile2} --name="1st Contributor Name" -v`,
    randomEntropy,
  );

  console.log('phase2 4');
  // Export the verification key:
  await execCmd(
    `snarkjs zkey export verificationkey ${zkeyFile2} ${verificationKeyFile}`,
  );
}

main();
