import {createServer} from 'node:http'
import {readFile} from 'node:fs/promises'
import {join, extname} from 'node:path'
import {fileURLToPath} from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
}

createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname
  const file =
    path === '/' ? 'playground/index.html' : path.slice(1)

  try {
    const data = await readFile(join(root, file))
    response.setHeader('content-type', types[extname(file)] ?? 'text/plain')
    response.end(data)
  } catch {
    response.statusCode = 404
    response.end('not found')
  }
}).listen(3000, () => {
  console.log('playground: http://localhost:3000')
})
