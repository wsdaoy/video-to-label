import { create } from "lodash"

let screenShot = function (player, screenShotOptions) {
  let callBack = null
  let imgDirHandler = null
  if (!screenShotOptions) {
    return
  }

  player.video.setAttribute('crossOrigin', 'anonymous')

  let encoderOptions = 0.92

  if (screenShotOptions.quality || screenShotOptions.quality === 0) {
    encoderOptions = screenShotOptions.quality
  }
  let type = screenShotOptions.type === undefined ? 'image/png' : screenShotOptions.type
  let format = screenShotOptions.format === undefined ? '.png' : screenShotOptions.format

  let canvas = document.createElement('canvas')
  let canvasCtx = canvas.getContext('2d')
  let img = new Image()
  
  // let saveScreenShot = function (data, filename) {
  //   let saveLink = document.createElement('a')
  //   saveLink.href = data
  //   saveLink.download = filename
  //   let event = document.createEvent('MouseEvents')
  //   event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
  //   saveLink.dispatchEvent(event)
  // }

  let saveBlobToFile = async function(fileBlob, filename) {
    // let file = new File([fileBlob], filename, {type: fileBlob.type})
    // const _tempFileHandler = await imgDirHandler.getFileHandle(filename)
    // await _tempFileHandler.remove()
    // 重新创建
    const _fileHandler = await imgDirHandler.getFileHandle(filename, { create: true })
    // 创建编写文件
    _fileHandler.createWritable().then(writable => {
      writable.write({type: 'write', position: 0, data: fileBlob}).then(() => {
        writable.close()
      })
    })
  }

  player.screenShot = function (_imgDirHandler, save = true) {
    save = screenShotOptions.saveImg === undefined ? save : screenShotOptions.saveImg
    canvas.width = player.video.videoWidth || 600
    canvas.height = player.video.videoHeight || 337.5
    callBack = screenShotOptions.callBack
    imgDirHandler = _imgDirHandler
    img.onload = (async function () {
      canvasCtx.drawImage(player.video, 0, 0, canvas.width, canvas.height)
      
      // img.src = canvas.toDataURL(type, encoderOptions).replace(type, 'image/octet-stream')
      // let screenShotImg = img.src.replace(/^data:image\/[^;]+/, 'data:application/octet-stream')
      let saveFileName = screenShotOptions.fileName || player.lang.SCREENSHOT
      // player.emit('screenShot', screenShotImg)
      
      canvas.toBlob((fileBlob) => {
        if (save && callBack) {
          callBack(fileBlob)
          // callBack(screenShotImg, saveFileName, format)
        } else {
          save && saveBlobToFile(fileBlob, saveFileName + format)
          // save && saveScreenShot(screenShotImg, saveFileName + format)
        }
      }, screenShotOptions.type, encoderOptions)

    })()
  }
  player.on('screenShotBtnClick', player.screenShot)

  function onDestroy () {
    player.off('screenShotBtnClick', player.screenShot)
    player.off('destroy', onDestroy)
  }
  player.once('destroy', onDestroy)
}

export default screenShot;