import { logger, runBash } from './util'
import path from 'path'

const DEFAULTS = {
  root: '',
  src: '',
  dest: '',
  tmpPath: '',
  size: '750x560',
}

let uuid = 0

class Labi {
  constructor (config) {
    this.shell = []
    this.config = this._getConfig(config)
  }

  _getConfig (config) {
    if (!config.src || !config.dest) {
      throw new Error(`config.src or config.dest is empty`)
    }
    config = Object.assign({}, DEFAULTS, config)
    if (!config.root) {
      config.root = process.cwd()
    }

    // config.tmpPath = path.resolve(config.root, `_${++uuid}`, `${config.dest}`)

    'src,dest'.split(',').forEach(k => {
      config[k] = path.resolve(config.root, config[k])
    })
    logger.info(config.tmpPath)
    return config
  }

  _joinShell (shell) {
    this.shell.push(shell)
  }

  get src () {
    if (!uuid) {
      ++uuid
      return this.config.src
    }
    return this.config.src + uuid++
  }

  get dest () {
    --uuid
    return this.src
  }

  sh (sh) {
    logger.info(
      '```' + '\n' +
        sh + '\n' +
      '```'
    )
    return runBash(sh)
  }

  zip () { // 压缩
    const shell = `ffmpeg -i ${this.src} -s ${this.config.size} ${this.dest}`
    logger.info(shell)
    this._joinShell(shell)
    return this
  }

  mute () { // 消音
    const shell = `ffmpeg -i ${this.src} -vcodec copy -an ${this.dest}`
    this._joinShell(shell)
    logger.info(shell)
    return this
  }

  async draw () {
    try {
      this.shell.unshift(`rm -rf ${this.config.dest}`)
      let shell = this.shell.join(';\n')
      // await this.sh(shell)
    } catch (e) {
      logger.error(e)
    }
  }
}

export default function (config) {
  return new Labi(config)
}
