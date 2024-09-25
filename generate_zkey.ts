import * as crypto from 'crypto';
import { execCmd } from 'utils';

export async function generateZKey(id: string, name: string) {
  await compileCircuits(id, name);
  const baseDir = `./tmp/${id}`;
  const tauFile1 = `${baseDir}/pot12_0000.ptau`;
  const tauFile2 = `${baseDir}/pot12_0001.ptau`;

  await execCmd(`snarkjs powersoftau new bn128 22 ${tauFile1} -v`);
  console.log('generated tauFile1');

  const randomEntropy = crypto.randomBytes(32).toString('hex');
  console.log('randomEntropy: ', randomEntropy);

  await execCmd(
    `snarkjs powersoftau contribute ${tauFile1} ${tauFile2} --name="First contribution" -v`,
    randomEntropy,
  );
  console.log('generated tauFile2');

  const tauFileFinal = `${baseDir}/pot12_final.ptau`;
  const r1csFile = `${baseDir}/${name}.r1cs`;
  const zkeyFile1 = `${baseDir}/key_0000.zkey`;
  const zkeyFile2 = `${baseDir}/key_0001.zkey`;
  const verificationKeyFile = `${baseDir}/verification_key.json`;
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

async function compileCircuits(id: string, name: string) {
  const baseDir = `./tmp/${id}`;
  const circuitPath = `${baseDir}/${name}.circom`;
  const nodeModulesDir = './node_modules';

  const circumOutput = await execCmd(
    `circom ${circuitPath} --r1cs --wasm --sym -o ${baseDir} -l ${nodeModulesDir}`,
  );
  console.log('circumOutput : ', circumOutput);
}
