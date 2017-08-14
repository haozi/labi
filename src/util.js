import childProcess from 'child_process'
import colors from 'colors/safe'
import datauri from 'datauri'

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



