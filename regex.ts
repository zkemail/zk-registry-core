import { genFromDecomposed } from "@zk-email/zk-regex-compiler";
import { v4 as uuidv4 } from "uuid";
import { existsSync, mkdirSync } from "fs";

type DecomposedRegexPart = {
  is_public: boolean;
  regex_def: string;
};

type DecomposedRegex = {
  parts: DecomposedRegexPart[];
};

interface Submission {
  DecomposedRegex: DecomposedRegex;
  circomTemplateName: string;
}

function createCircomCircuit(
  decomposedRegex: DecomposedRegex,
  circomTemplateName: string
): string {
  return genFromDecomposed(JSON.stringify(decomposedRegex), circomTemplateName);
}

function compileCircomCircuit(circomFilePath: string): boolean {
  const execSync = require("child_process").execSync;
  try {
    execSync(`circom ${circomFilePath} --r1cs --wasm --sym`, {
      stdio: "inherit",
    });
    return true;
  } catch (error) {
    console.error("Error during compilation:", error);
    return false;
  }
}

function handleSubmission(submission: Submission): string {
  const tempFolderPath = "./tmp";
  if (!existsSync(tempFolderPath)) {
    mkdirSync(tempFolderPath);
  }

  let circuit = createCircomCircuit(
    submission.DecomposedRegex,
    submission.circomTemplateName
  );

  let id = uuidv4();

  // Create a new folder for the submission
  let submissionFolderPath = `${tempFolderPath}/${id}`;
  mkdirSync(submissionFolderPath);

  // Write the circom file
  let circomFilePath = `${submissionFolderPath}/${id}.circom`;

  // Compile the circom file
  let compiled = compileCircomCircuit(circomFilePath);
  if (!compiled) {
    return "Error during compilation";
  }
}
