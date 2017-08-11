import childProcess from 'child_process'
import colors from 'colors/safe'

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
