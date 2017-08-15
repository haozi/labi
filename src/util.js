import childProcess from 'child_process'
import colors from 'colors/safe'
import datauri from 'datauri'
import fs from 'fs'
import zlib from 'zlib'

export function runBash (bash, options = {}) {
  bash = String(bash).trim() + '\n'
  return new Promise((resolve, reject) => {
    const p = childProcess.exec(bash, options, (error) => {
      if (error) {
        console.log(error)
        reject(error)
        return
      }

      resolve()
    })
    p.stderr.pipe(process.stderr)
    p.stdout.pipe(process.stdout)
  })
}

export const logger = {
  log (s) {
    console.log(s)
  },

  info (s) {
    console.log(colors.green(s))
  },

  warn (s) {
    console.warn(colors.yellow(s))
  },

  error (s) {
    console.log(colors.red(s))
  }
}

export function unique (arr) {
  return [...new Set(arr)]
}

export function base64 (path) {
  return datauri.promise(path)
}

/**
 * 把 callback 变成 Promise 要求 callback 的第一个形参为 error
 */
export function promisify (fn, receiver) {
  return (...args) => {
    return new Promise((resolve, reject) => {
      fn.apply(receiver, [...args, (err, res) => {
        return err ? reject(err) : resolve(res)
      }])
    })
  }
}

export function stringify (str) {
  str = '"' + str.replace(/'/g, '\\\\\'').replace(/"/g, '\\"') + '"'
  return str
}

export function gzip ({code, path}) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, buf) => {
      if (err) return reject(err)
      zlib.gzip(buf, (err, buf) => {
        if (err) return reject(err)
        resolve(buf)
      })
    })
  })
}

export function getSize ({code, path}) {
  let byte
  if (path) {
    byte = fs.statSync(path).size
  } else {
    byte = code.length
  }
  let ret = {
    s: byte + ' B',
    r: byte
  }
  if (byte >= 1024) {
    ret.s = +(byte / 1024).toFixed() + ' KB'
  }

  if (byte >= 1024 ** 2) {
    ret.s = +(byte / 1024 ** 2).toFixed(1) + ' MB'
  }

  if (byte >= 1024 ** 3) {
    ret.s = +(byte / 1024 ** 3).toFixed(2) + ' GB'
  }
  return ret
}

export function sleep (delay) {
  return new Promise(resolve => {
    setTimeout(resolve, delay * 1000)
  })
}

