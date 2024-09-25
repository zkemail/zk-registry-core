import fs from 'fs/promises';
import { DecomposedRegex, ExternalInput } from 'zk-email-sdk-js';

type GenerateCircuitTemplateProps = {
  decomposedRegexes: DecomposedRegex[];
  externalInputs: ExternalInput[];
  circuitName: string;
  ignoreBodyHashCheck?: boolean;
  enableHeaderMasking?: boolean;
  enableBodyMasking?: boolean;
  emailBodyMaxLength?: number;
  // enableHeaderMasking = false,
  // enableBodyMasking = false,
  // emailBodyMaxLength: number,
};

export function generateCircuitTemplate({
  decomposedRegexes,
  externalInputs,
  circuitName,
  ignoreBodyHashCheck = false,
  enableHeaderMasking = false,
  enableBodyMasking = false,
  emailBodyMaxLength = 4032,
}: GenerateCircuitTemplateProps): string {
  console.log('decomposedRegexes: ', decomposedRegexes);
  console.log('externalInputs: ', externalInputs);
  console.log('circuitName: ', circuitName);
  console.log('ignoreBodyHashCheck : ', ignoreBodyHashCheck);
  console.log('enableHeaderMasking : ', enableHeaderMasking);
  console.log('enableBodyMasking : ', enableBodyMasking);
  console.log('emailBodyMaxLength : ', emailBodyMaxLength);

  return `pragma circom 2.1.6;
include "@zk-email/circuits/email-verifier.circom";
include "@zk-email/circuits/utils/regex.circom";

${decomposedRegexes
  .map((value) => `include "./regex/${value.name}.circom";`)
  .join('\n')}

template ${circuitName}(maxHeaderLength, maxBodyLength, n, k, packSize) {
    assert(n * k > 1024); // constraints for 1024 bit RSA

    signal input emailHeader[maxHeaderLength]; // prehashed email data, includes up to 512 + 64? bytes of padding pre SHA256, and padded with lots of 0s at end after the length
    signal input emailHeaderLength;
    signal input pubkey[k]; // rsa pubkey, verified with smart contract + DNSSEC proof. split up into k parts of n bits each.
    signal input signature[k]; // rsa signature. split up into k parts of n bits each.

    ${externalInputs
      .map(
        (input) => `
    signal input ${input.name}[${
          Math.floor(input.maxLength / 31) + (input.maxLength % 31 ? 1 : 0)
        }];
    signal ${input.name}Squared[${
          Math.floor(input.maxLength / 31) + (input.maxLength % 31 ? 1 : 0)
        }];
    for (var i = 0; i < ${
      Math.floor(input.maxLength / 31) + (input.maxLength % 31 ? 1 : 0)
    }; i++) {
    ${input.name}Squared[i] <== ${input.name}[i] * ${input.name}[i];
    }
    `,
      )
      .join('')}

    // DKIM Verification
    component EV = EmailVerifier(maxHeaderLength, maxBodyLength, n, k, ${
      ignoreBodyHashCheck ? 1 : 0
    }, ${enableHeaderMasking ? 1 : 0}, ${enableBodyMasking ? 1 : 0}, 1);
    EV.emailHeader <== emailHeader;
    EV.emailHeaderLength <== emailHeaderLength;
    EV.pubkey <== pubkey;
    EV.signature <== signature;

    ${
      !ignoreBodyHashCheck
        ? `
    signal input bodyHashIndex;
    signal input precomputedSHA[32];
    signal input emailBody[maxBodyLength];
    signal input emailBodyLength;
    signal input decodedEmailBodyIn[maxBodyLength];

    EV.bodyHashIndex <== bodyHashIndex;
    EV.precomputedSHA <== precomputedSHA;
    EV.emailBody <== emailBody;
    EV.emailBodyLength <== emailBodyLength;
    EV.decodedEmailBodyIn <== decodedEmailBodyIn;
    `
        : ''
    }

    ${
      enableHeaderMasking
        ? `
    signal input headerMask[maxHeaderLength];

    EV.headerMask <== headerMask;
    `
        : ''
    }

    ${
      enableBodyMasking
        ? `
        signal input bodyMask[maxBodyLength];

        EV.bodyMask <== bodyMask;
        `
        : ''
    }

    signal output pubkeyHash;
    pubkeyHash <== EV.pubkeyHash;

    ${
      enableHeaderMasking
        ? `
    signal output maskedHeader;
    maskedHeader <== EV.maskedHeader;
    `
        : ''
    }

    ${
      enableBodyMasking
        ? `
    signal output maskedBody;
    maskedBody <== EV.maskedBody;
    `
        : ''
    }


    // Used for nullifier later
    signal headerHash[256] <== EV.sha;

    ${decomposedRegexes
      .map(
        (value) => `
    // ${value.name.toUpperCase()} Extraction
    signal input ${value.name}RegexIdx;
    var ${value.name}MaxLength = ${value.maxLength};
    signal ${value.name}RegexOut, ${value.name}RegexReveal[${
          value.location === 'body' ? 'maxBodyLength' : 'maxHeaderLength'
        }];
    (${value.name}RegexOut, ${value.name}RegexReveal) <== ${value.name}(${
          value.location === 'body' ? 'maxBodyLength' : 'maxHeaderLength'
        })(emailBody);
    ${value.name}RegexOut === 1;

    signal output ${value.name}PackedOut[computeIntChunkLength(${
          value.name
        }MaxLength)];
    ${value.name}PackedOut <== PackRegexReveal(${
          value.location === 'body' ? 'maxBodyLength' : 'maxHeaderLength'
        }, ${value.name}MaxLength)(${value.name}RegexReveal, ${
          value.name
        }RegexIdx);
    `,
      )
      .join('')}
}

${
  externalInputs.length > 0
    ? `
component main { public [${externalInputs
        .map((i) => i.name)
        .join(', ')}]} = ${circuitName}(1024, ${
        ignoreBodyHashCheck ? 0 : emailBodyMaxLength
      }, 121, 17, 7);
`
    : `
component main = ${circuitName}(1024, ${
        ignoreBodyHashCheck ? 0 : emailBodyMaxLength
      }, 121, 17, 7);
`
}
`;
}
