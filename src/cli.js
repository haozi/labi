import fs from 'fs'
import yargs from 'yargs'
// import labi from './index'

yargs
  .usage('$0 <cmd> [args]')
  // .command('zip', 'show max version', yargs => {
  //   labi().max().then(v => {
  //     console.log(v)
  //   })
  // })
  // .command('water', 'checkout', yargs => {
  //   labi().checkout()
  // })
  // .command('cut', 'deploy branch', yargs => {
  //   const needPing = yargs.argv.ping === true || yargs.argv.ping === 'true'
  //   labi({needPing}).deploy()
  // })
  .version()
  .alias('v', 'version')

  .help()
  .alias('h', 'help')
  .argv

if (process.argv.length < 3) {
  console.log('\x1b[32m%s\x1b[0m', fs.readFileSync(`${__dirname}/logo`, 'utf8'))
  console.log(yargs.getUsageInstance().help())
}
