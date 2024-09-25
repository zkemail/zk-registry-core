import { execCmd } from 'utils';
import { Worker } from 'node:worker_threads';
import { ethers } from 'ethers';

async function deployContract(id: string): Promise<string> {
  await generateContract(id);
  const compiledContract = await compileContract(id);
  console.log('Compilation complete');

  const contractFile = compiledContract.contracts['Verifier.sol']!['Verifier']!;

  const abi = contractFile.abi;
  const bytecode = contractFile.evm.bytecode.object;

  // Connect to the network
  const provider = new ethers.JsonRpcProvider('YOUR_RPC_URL');

  // Your wallet private key
  const privateKey = 'YOUR_PRIVATE_KEY';
  const wallet = new ethers.Wallet(privateKey, provider);

  // Create a factory for the Verifier contract
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);

  // Deploy the contract
  console.log('Deploying Verifier contract...');
  const contract = await factory.deploy(/* constructor arguments if any */);

  // Wait for the contract to be mined
  await contract.waitForDeployment();

  // Get the address of the deployed contract
  const deployedAddress = await contract.getAddress();
  console.log('deployedAddress :', deployedAddress);

  return deployedAddress;
}

async function generateContract(id: string) {
  const zkeyFile = `./tmp/${id}/key_0001.zkey`;
  const contractOutputFile = `./tmp/${id}/verifier.sol`;
  await execCmd(
    `snarkjs zkey export solidityverifier ${zkeyFile} ${contractOutputFile}`,
  );
}

interface CompiledContract {
  contracts: {
    [fileName: string]: {
      [contractName: string]: {
        abi: any[];
        evm: {
          bytecode: {
            object: string;
          };
        };
      };
    };
  };
}

function compileContract(id: string): Promise<CompiledContract> {
  const contractPath = `./tmp/${id}/verifier.sol`;
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      `
        import solc from 'solc';
        import fs from 'fs';
        import path from 'path';
        import { parentPort } from 'worker_threads';

        parentPort!.on('message', (contractPath: string) => {
            const source = fs.readFileSync(contractPath, 'utf8');
            const input = {
                language: 'Solidity',
                sources: {
                    'Verifier.sol': {
                        content: source,
                    },
                },
                settings: {
                    outputSelection: {
                        '*': {
                            '*': ['*'],
                        },
                    },
                },
            };

            const compiledContract = JSON.parse(solc.compile(JSON.stringify(input)));
            parentPort!.postMessage(compiledContract);
        });
      `,
      { eval: true },
    );

    worker.on('message', (result: CompiledContract) => resolve(result));
    worker.on('error', reject);
    worker.on('exit', (code: number) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });

    worker.postMessage(contractPath);
  });
}
