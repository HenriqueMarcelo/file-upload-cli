#! /usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const ProgressBar = require('progress');

const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 --file <file> --url <url> [--method <method>] [--name <name>] [--auth <auth>]')
    .option('file', {
        alias: 'f',
        describe: 'Path to the file to upload',
        demandOption: 'The file path is required',
        type: 'string'
    })
    .option('url', {
        alias: 'u',
        describe: 'URL of the server to upload the file',
        demandOption: 'The URL is required',
        type: 'string'
    })
    .option('method', {
        alias: 'm',
        describe: 'HTTP method to use for the upload',
        default: 'POST',
        type: 'string'
    })
    .option('name', {
        alias: 'n',
        describe: 'Name of the file field',
        default: 'file',
        type: 'string'
    })
    .option('auth', {
        alias: 'a',
        describe: 'Authorization header value (e.g., "Bearer <token>" or "Basic <base64>")',
        type: 'string'
    })
    .argv;

const filePath = path.resolve(argv.file);
const url = argv.url;
const method = argv.method.toUpperCase();
const fileName = argv.name;

if (!fs.existsSync(filePath)) {
    console.error(`The file ${filePath} does not exist`);
    process.exit(1);
}

const form = new FormData();
const fileStream = fs.createReadStream(filePath);
form.append(fileName, fileStream);

const headers = form.getHeaders();
if (argv.auth) {
    headers['Authorization'] = argv.auth;
}

const bar = new ProgressBar('Uploading [:bar] :percent :etas', { total: fs.statSync(filePath).size });

fileStream.on('data', chunk => {
    bar.tick(chunk.length);
});

axios({
    method: method,
    url: url,
    headers: headers,
    data: form,
    maxContentLength: Infinity,
    maxBodyLength: Infinity
})
.then(response => {
    console.log('File uploaded successfully:', response.data);
})
.catch(error => {
    console.error('Error uploading file:', error.message);
});
