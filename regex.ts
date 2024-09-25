import { genFromDecomposed } from '@zk-email/zk-regex-compiler';
// import { v4 as uuidv4 } from 'uuid';
// import { existsSync, mkdirSync } from 'fs';
import fs from 'fs/promises';
import init from '@zk-email/zk-regex-compiler';
import path from 'path';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { DecomposedRegex } from 'zk-email-sdk-js';

const exec = promisify(execCallback);

// Using exec (for simpler commands)
async function execCmd(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await exec(command);
    console.log('Command Output:', stdout);
    if (stderr) {
      throw new Error(`Command failed: ${stderr}`);
    }
    return stdout;
  } catch (error) {
    throw new Error(`Failed to execute command: ${error}`);
  }
}

// TODO: use env var
const COMPILED_CIRCUIT_OUT_DIR = './tmp/compiled_circuit';

init()
  .then(() => {
    console.log('Initialized wasm');
  })
  .catch((err) => {
    console.error('Failed to initialize wasm: ', err);
  });

/* 1. Create and save a new circuit.
 * 2. Deploy a verifier on chain.
 * 3. Save the circuit and infomation about the verifier contract to the registry.
 */

// type DecomposedRegexPart = {
//   is_public: boolean;
//   regex_def: string;
// };

// type DecomposedRegex = {
//   parts: DecomposedRegexPart[];
// };

// interface Submission {
//   DecomposedRegex: DecomposedRegex;
//   circomTemplateName: string;
// }

export async function generateDecomposedRegexesCircuitTemplates(
  decomposedRegexes: DecomposedRegex[],
  id: string,
) {
  for (const decomposedRegex of decomposedRegexes) {
    const str = JSON.stringify(decomposedRegex);
    const templateStr = genFromDecomposed(str, decomposedRegex.name);
    const name = decomposedRegex.name.replaceAll(' ', '');
    await fs.writeFile(`./tmp/${id}/regex/${name}.circom`, templateStr);
  }
}

// save compiled circuit
// circom multiplier2.circom --r1cs --wasm --sym -o output_dir -l ./node_modules/
export async function compileCircuit(
  circuitPath: string,
  id: string,
): Promise<void> {
  const nodeModulesDir = './node_modules';

  const outputDir = `${COMPILED_CIRCUIT_OUT_DIR}/${id}`;
  console.log('outputDIr: ', outputDIr);

  await fs.mkdir(outputDir);

  const circomResult = await execCmd(
    `circom ${circuitPath} --r1cs --wasm --sym -o ${outputDir} -l ${nodeModulesDir}`,
  );
  console.log('circomResult: ', circomResult);
}

// function handleSubmission(submission: Submission): string {
//   const tempFolderPath = './tmp';
//   if (!existsSync(tempFolderPath)) {
//     mkdirSync(tempFolderPath);
//   }

//   let circuit = createCircomCircuit(
//     submission.DecomposedRegex,
//     submission.circomTemplateName,
//   );

//   let id = uuidv4();

//   // Create a new folder for the submission
//   let submissionFolderPath = `${tempFolderPath}/${id}`;
//   mkdirSync(submissionFolderPath);

//   // Write the circom file
//   let circomFilePath = `${submissionFolderPath}/${id}.circom`;

//   // Compile the circom file
//   let compiled = compileCircomCircuit(circomFilePath);
//   if (!compiled) {
//     return 'Error during compilation';
//   }
// }
