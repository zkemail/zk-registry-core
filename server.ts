// Importing module
import express from 'express';
import { RegexBlueprintProps } from 'zk-email-sdk-js';
import { compileCircuit, createCircomCircuit } from './regex';
import { prisma } from 'db';
import fs from 'fs/promises';

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
    let circuit = createCircomCircuit(
      props.decomposedRegex,
      props.metaData.name,
    );

    const mainFnStr = `\ncomponent main = ${props.metaData.name}(1024);`;

    circuit += mainFnStr;

    console.log('circuit : ', circuit);

    const newBlueprint = await prisma.regexBlueprint.create({
      data: {
        ...props.metaData,
        circuit,
        circuitType: props.provingScheme,
        decomposedRegex: props.decomposedRegex,
      },
    });
    console.log('newBlueprint : ', newBlueprint);

    const circuitId = newBlueprint.id.toString();
    const circuitPath = `${CIRCUIT_OUT_DIR}/${circuitId}.circom`;
    console.log('circuitPath: ', circuitPath);
    await fs.writeFile(circuitPath, circuit);
    console.log('file written');
    await compileCircuit(circuitPath, circuitId);
    console.log('compilation done');

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
