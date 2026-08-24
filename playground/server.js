import {createServer} from 'node:http'
import {readFile} from 'node:fs/promises'
import {readFileSync} from 'node:fs'
import {join, extname} from 'node:path'
import {fileURLToPath} from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
}

/** Resolved bare specifiers, keyed by package name. */
const resolved = new Map()

/**
 * Resolve the browser URL of a package’s default entry, based on its own
 * `package.json`.
 *
 * @param {string} name
 *   Package name.
 * @returns {string | undefined}
 *   Browser URL, or `undefined` on failure.
 */
function resolvePackage(name) {
  if (resolved.has(name)) return resolved.get(name)

  try {
    const pkg = JSON.parse(
      readFileSync(join(root, 'node_modules', name, 'package.json'))
    )
    const entry = typeof pkg.exports === 'object' ? pkg.exports['.'] : pkg.exports
    let file =
      typeof entry === 'string'
        ? entry
        : (entry?.default ??
          Object.values(entry ?? {}).find((d) => typeof d === 'string'))
    if (!file) file = pkg.main ?? './index.js'
    const url =
      '/node_modules/' + name + (file.startsWith('.') ? file.slice(1) : file)
    resolved.set(name, url)
    return url
  } catch {
    return undefined
  }
}

/**
 * Rewrite bare specifiers (`import … from 'x'`) to browser URLs.
 *
 * @param {string} code
 *   JavaScript source.
 * @returns {string}
 *   Rewritten source.
 */
function rewriteBareSpecifiers(code) {
  return code.replace(
    /(from\s*|import\s*\(?\s*)('|")([^'"\n]+)\2/g,
    (match, prefix, quote, specifier) => {
      if (specifier.startsWith('.') || specifier.startsWith('/')) return match
      const target = resolvePackage(specifier)
      return target ? prefix + quote + target + quote : match
    }
  )
}

createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname
  const file = path === '/' ? 'playground/index.html' : path.slice(1)

  try {
    let data = await readFile(join(root, file))
    if (extname(file) === '.js') data = rewriteBareSpecifiers(String(data))
    response.setHeader('content-type', types[extname(file)] ?? 'text/plain')
    response.end(data)
  } catch {
    response.statusCode = 404
    response.end('not found')
  }
}).listen(3000, () => {
  console.log('playground: http://localhost:3000')
})
