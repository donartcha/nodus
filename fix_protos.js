const fs = require('fs/promises');
const path = require('path');
const glob = require('globby');

async function main() {
    const files = await glob('proto/**/*.proto');
    for (const file of files) {
        let content = await fs.readFile(file, 'utf8');
        // Find 'rpc methodName(' and replace with 'rpc MethodName('
        content = content.replace(/rpc\s+([a-zA-Z0-9_]+)\s*\(/g, (match, name) => {
            const pascalCaseName = name.charAt(0).toUpperCase() + name.slice(1);
            return \pc \(\;
        });
        await fs.writeFile(file, content, 'utf8');
        console.log(\Processed \\);
    }
}
main().catch(console.error);
