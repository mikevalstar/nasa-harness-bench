import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(process.argv.includes('--dist')?'dist':'.');
http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+path.sep))throw Error();const body=await readFile(file);res.setHeader('Content-Type',({'html':'text/html','js':'text/javascript','css':'text/css','json':'application/json'})[file.split('.').pop()]||'application/octet-stream');res.end(body)}catch{res.writeHead(404);res.end('Not found')}}).listen(5173,()=>console.log('http://localhost:5173'));
