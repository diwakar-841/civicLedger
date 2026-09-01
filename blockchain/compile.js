const fs = require("fs");
const path = require("path");
const solc = require("solc");

const CONTRACTS_DIR = path.join(__dirname, "contracts");
const ARTIFACTS_DIR = path.join(__dirname, "artifacts");

function findImports(importPath) {
  const fullPath = path.join(CONTRACTS_DIR, importPath);
  try {
    return { contents: fs.readFileSync(fullPath, "utf8") };
  } catch {
    return { error: `File not found: ${importPath}` };
  }
}

function compileEntryFile(fileName) {
  const source = fs.readFileSync(path.join(CONTRACTS_DIR, fileName), "utf8");

  const input = {
    language: "Solidity",
    sources: {
      [fileName]: { content: source },
    },
    settings: {
      outputSelection: {
        "*": { "*": ["abi", "evm.bytecode.object"] },
      },
    },
  };

  const output = JSON.parse(
    solc.compile(JSON.stringify(input), { import: findImports }),
  );

  if (output.errors) {
    const fatal = output.errors.filter((e) => e.severity === "error");
    for (const err of output.errors) console.log(err.formattedMessage);
    if (fatal.length) throw new Error(`Compilation failed for ${fileName}`);
  }

  return output.contracts[fileName];
}

function main() {
  if (!fs.existsSync(ARTIFACTS_DIR))
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

  const compiled = compileEntryFile("Voting.sol");

  for (const [contractName, contractData] of Object.entries(compiled)) {
    const artifact = {
      contractName,
      abi: contractData.abi,
      bytecode: "0x" + contractData.evm.bytecode.object,
    };
    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, `${contractName}.json`),
      JSON.stringify(artifact, null, 2),
    );
    console.log(
      "Compiled:",
      contractName,
      "->",
      `artifacts/${contractName}.json`,
    );
  }
}

main();
