import { logger, runBash, unique, base64, promisify, stringify as S } from './util'
import path from 'path'
import fs from 'fs'

const DEFAULTS = {
  root: '',
  src: '',
  dest: '',
  size: '750x422',
  stringify: false,
  zip: true,
  mute: false
}

let uuid = 0

class Labi {
  constructor (config) {
    this.config = this._getConfig(config)
    this.timer = 0
    this.tmpPath = []
  }

  _getConfig (config) {
    if (!config.src || !config.dest) {
      throw new Error(`config.src or config.dest is empty`)
    }
    config = Object.assign({}, DEFAULTS, config)
    if (!config.root) {
      config.root = process.cwd()
    }

    'src,dest'.split(',').forEach(k => {
      config[k] = path.resolve(config.root, config[k])
    })
    return config
  }

  getSrc (update) {
    if (!uuid) {
      return this.config.src
    }
    --uuid
    return this.getDest()
  }

  getDest (noUpdate) {
    let tmpDest = `${this.config.dest}~${noUpdate ? --uuid : uuid++}${path.extname(this.config.dest)}`
    this.tmpPath.push(tmpDest)
    return tmpDest
  }

  _sh (shell) {
    if (Array.isArray(shell)) {
      shell = shell.join(' && ')
    }
    shell = String(shell).trim()
    logger.info(
      '```shell' + '\n' +
        shell.split(/\s+&&\s+/).join(' &&\n') + '\n' +
      '```'
    )
    if (!shell) return
    process.chdir(this.config.root)
    return runBash(shell)
  }

  /**
   * 压缩
   */
  async _zip ({size} = {}) {
    const shell = `ffmpeg -i ${S(this.getSrc())} -s ${S(size || this.config.size)} ${S(this.getDest())} #zip`
    await this._sh(shell)
  }

  /**
   * 消音
   */
  async _mute () {
    const shell = `ffmpeg -i ${S(this.getSrc())} -vcodec copy -an ${S(this.getDest())} #mute`
    await this._sh(shell)
  }

  async _stringify () {
    let str = await base64(this.config.dest)
    await promisify(fs.writeFile, fs)(this.config.dest + '.js', str, 'utf8')
  }

  async draw () {
    const config = this.config
    try {
      if (this.timer) {
        throw new Error('draw() 方法只能调用一次')
      }
      ++this.timer
      await this._sh([
        `cd ${S(config.root)}`,
        `rm -rf ${S(config.dest)}*`
      ])

      config.zip && await this._zip()
      config.mute && await this._mute()

      await this._sh([
        `mv ${S(this.getDest(true))} ${S(config.dest)}`,
        `rm -rf ${unique(this.tmpPath).map(item => S(item)).join(' ')}`
      ])

      if (config.stringify) {
        await this._stringify()
      }

      let ret = Object.assign({}, config)
      ret.destString = config.dest + '.js'
      return ret

    } catch (e) {
      logger.error(e)
    }
  }
}

export default function (config) {
  return new Labi(config)
}
