// Importing module
import express from 'express';
import { ProvingScheme, RegexBlueprintProps } from 'zk-email-sdk-js';
import { generateDecomposedRegexesCircuitTemplates } from './regex';
import { prisma } from 'db';
import { CircuitType } from '@prisma/client';
import fs from 'fs/promises';
import { generateCircuitTemplate } from 'circuit_template';
import { generateZKey } from 'generate_zkey';

const CIRCUIT_OUT_DIR = './tmp/circuit';

const app = express();
app.use(express.json());
// Use port from environment variable or default to 3000
const PORT: number = parseInt(process.env.PORT || '3000');

// // Handling GET / Request
// app.get('/', (req, res) => {
//   res.send('Welcome to typescript backend!');
// });

app.post('/submit', async (req, res) => {
  try {
    const props = req.body as RegexBlueprintProps;
    console.log('props: ', props);

    const newBlueprint = await prisma.regexBlueprint.create({
      data: {
        ...props.metaData,
        // TODO: use ProvingScheme type
        decomposedRegexes: props.decomposedRegexes,
      },
    });
    console.log('newBlueprint : ', newBlueprint);
    const id = newBlueprint.id.toString();

    // create folder in temp folder id
    // create regex folder -> one .circom for each dr using genFromDecomposec
    await fs.mkdir(`./tmp/${id}`);
    await fs.mkdir(`./tmp/${id}/regex`);

    await generateDecomposedRegexesCircuitTemplates(
      props.decomposedRegexes,
      id,
    );

    console.log('generated decomposed regex circuit templates');

    // Call circuit_teplate, put file in id/name.circom
    // -> compile that
    const template = generateCircuitTemplate({
      decomposedRegexes: props.decomposedRegexes,
      externalInputs: props.externalInputs || [],
      circuitName: props.metaData.name.replaceAll(' ', ''),
      ignoreBodyHashCheck: props.ignoreBodyHashCheck,
      enableHeaderMasking: props.enableHeaderMasking,
      enableBodyMasking: props.enableBodyMasking,
      emailBodyMaxLength: props.metaData.emailBodyMaxLength,
    });

    console.log('generated circuite template');

    const name = props.metaData.name.replaceAll(' ', '');
    await fs.writeFile(`./tmp/${id}/${name}.circom`, template);

    console.log('genrating vkey');
    await generateZKey(id, name);

    res.status(200).json({ message: 'Ok' });
  } catch (err) {
    console.error('Failed in /submit: ', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Server setup
app.listen(PORT, () => {
  console.log(
    'The application is listening ' + 'on port http://localhost:' + PORT,
  );
});
