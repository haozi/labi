import { logger, runBash, base64, promisify, gzip, getSize, stringify as S, getImageSize, parseSize } from './util'
import path from 'path'
import fs from 'fs'
import Table from 'cli-table'
import colors from 'colors/safe'
import './global'

let isDebug = global.isDebug
const DEFAULTS = {
  root: '',
  src: '',
  dest: '',
  destStr: '',
  watermask: null,
  size: '750x422',
  stringify: false,
  zip: true,
  mute: false,
  cut: null,
  compareOrigin: true // 与原始文件对比，如果比原始文件体积大，使用原始文件
}

class Labi {
  constructor (config) {
    this.uuid = 0
    this.timer = 0
    this.config = this._getConfig(config)
    this.tmpPath = `${process.env.HOME}/.labi/.tmp/${(Math.random() * 1e9).toFixed()}_${Date.now()}`

    config.debug != null && (isDebug = global.isDebug = config.debug)
    isDebug && (this.tmpPath = `${this.config.root}/_debug`)
  }

  async ffmpeg (shell) {
    await this._sh(`ffmpeg ${shell}`)
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
    config.destStr = config.dest + '.js'
    return config
  }

  getSrc (update) {
    if (!this.uuid) return this.config.src

    --this.uuid
    return this.getDest()
  }

  getDest (noUpdate) {
    let root = this.tmpPath
    let tmpDest = `${root}/${noUpdate ? --this.uuid : this.uuid++}${path.extname(this.config.dest)}`
    return tmpDest
  }

  _sh (shell) {
    if (Array.isArray(shell)) {
      shell = shell.filter(Boolean).filter(item => !!String(item).trim()).join(' && ')
    }
    shell = String(shell).trim()

    isDebug && logger.info(
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
  async _zip ({size, compareOrigin = false} = {}) {
    const src = this.getSrc()
    const dest = this.getDest()
    const vsize = parseSize(size || this.config.size, '750x422')
    const shell = `ffmpeg -i ${S(src)} -s ${S(vsize.width + 'x' + vsize.height)} ${S(dest)} #zip`
    await this._sh(shell)

    if (
      compareOrigin &&
      (fs.statSync(dest).size - fs.statSync(src).size > 0)
    ) { // 压缩后体积反而变大
      logger.warn('Greater than the original file')
      await this._sh([
        `rm -rf ${S(dest)}`,
        `cp ${src} ${S(dest)}`
      ])
    }
  }

  /**
   * 剪辑
   */
  async _cut () {
    const src = this.getSrc()
    const dest = this.getDest()
    if (!Array.isArray(this.config.cut)) {
      this.config.cut = [this.config.cut]
    }
    if (this.config.cut.length === 1) {
      const {start, duration} = this.config.cut[0]
      await this._sh(`ffmpeg -ss ${start} -i ${S(src)} -vcodec copy -acodec copy -t ${duration} ${S(dest)} #cut`)
      return
    }

    let inputFile = []
    let promiseSplit = []
    const text = `${dest}_split.txt`
    this.config.cut.forEach((list, index) => {
      const {start, duration} = list
      const split = `${dest}_split${index}${path.extname(dest)}`
      inputFile.push(split)
      const shell = `ffmpeg -ss ${start} -i ${S(src)} -vcodec copy -acodec copy -t ${duration} ${S(split)} #cut`
      promiseSplit.push(this._sh(shell))
      this._sh(`echo 'file ${(split)}' >> ${S(text)}`)
    })
    await Promise.all(promiseSplit)
    await this._sh(`ffmpeg -f concat -safe 0 -i ${S(text)} -c copy ${S(dest)} #concat`)
  }

  /**
   * 消音
   */
  async _mute () {
    const shell = `ffmpeg -i ${S(this.getSrc())} -vcodec copy -an ${S(this.getDest())} #mute`
    await this._sh(shell)
  }

  /**
   * 加水印
   * @param {方向 tl, tr, br, bl, ct 默认左上角} direction
   */
  async _watermask () {
    let {direction = 'tl', pic, size} = this.config.watermask || {}

    pic = path.resolve(this.config.root, pic)
    const rawImgSize = getImageSize({path: pic})
    const {width: imgWidth, height: imgHeight} = parseSize(size, `${rawImgSize.width}x${rawImgSize.height}`)
    const overlays = {
      tl: '0:0',
      tr: 'main_w-overlay_w:0',
      br: 'main_w-overlay_w:main_h-overlay_h',
      bl: '0: main_h-overlay_h',
      ct: '(main_w-overlay_w)/2:(main_h-overlay_h)/2'
    }

    const overlay = overlays[direction]
    const shell = `ffmpeg -i ${S(this.getSrc())} -vf  "movie=${S(pic)},scale=${imgWidth}:${imgHeight}[watermask]; [in] [watermask] overlay=${overlay} [out]" ${S(this.getDest())}`
    await this._sh(shell)
  }

  async _stringify () {
    let str = (await base64(this.config.dest)).trim()
    if (this.config.stringify && this.config.stringify.callback) {
      str = `${this.config.stringify.callback}('${str}')`
    }
    await promisify(fs.writeFile, fs)(this.config.dest + '.js', str, 'utf8')
  }

  _result ({src: sSrc, dest: sDest, destStr: sDestStr, destStrGzip: sGzipStr}) {
    let table = new Table({
      head: ['name', 'size', 'saved']
    })

    table.push(
      [path.basename(this.config.src) + ' (raw)', sSrc.s.padStart(8), ''],
      [path.basename(this.config.dest) + ' (output)', sDest.s.padStart(8), `${saved(sDest.r, sSrc.r)}`],
      [path.basename(this.config.destStr), sDestStr.s.padStart(8), `${saved(sDestStr.r, sSrc.r)}`],
      [path.basename(this.config.destStr) + colors.cyan(' (gzip)'), sGzipStr.s.padStart(8), `${saved(sGzipStr.r, sSrc.r)}`],
    )

    function saved (s, m) {
      let r = ''
      if (s === m || !m) {
        r = '0'
      } else {
        r = +((1 - (s / m)) * 100).toFixed(2) + ''
      }
      return r.padStart(5) + ' %'
    }
    logger.log(table.toString())
  }

  /**
   * 初始化脚本
   */
  async draw () {
    const start = Date.now()
    const config = this.config
    try {
      if (this.timer) throw new Error('draw() 方法只能调用一次')
      ++this.timer
      await this._sh([
        `rm -rf ${this.tmpPath}`,
        `mkdir -p ${this.tmpPath}`,
        `cd ${S(config.root)}`,
        `rm -rf ${S(config.dest)}*`
      ])

      // 先去音轨再压缩，速度能提升 1 倍
      config.cut && await this._cut()
      config.mute && await this._mute()
      if (config.watermask) {
        await this._zip({compareOrigin: false}) // 不做这一步会使得水印计算不准
        await this._watermask({direction: this.config.watermask.direction})
      }
      config.zip && await this._zip({compareOrigin: this.config.compareOrigin})

      await this._sh([
        `mkdir -p ${S(path.dirname(config.dest))}`,
        `mv ${S(this.getDest(true))} ${S(config.dest)}`,
        !isDebug && `rm -rf ${this.tmpPath}`
      ])

      if (config.stringify) {
        await this._stringify()
      }

      let ret = {
        size: {
          src: getSize({path: this.config.src}),
          dest: getSize({path: this.config.dest}),
          destStr: getSize({path: this.config.destStr}),
          destStrGzip: getSize({code: await gzip({path: this.config.destStr})})
        }
      }
      if (isDebug) {
        ret._config = config
      }

      this._result(ret.size)
      logger.info(`time used: ${((Date.now() - start) / 1000).toFixed(3) - 0}s`)
      return ret
    } catch (e) {
      logger.error(e)
    }
  }
}

export default function (config) {
  return new Labi(config)
}
