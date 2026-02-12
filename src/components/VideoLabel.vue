<template>
  <div class="main-container">
    <div class="main-wrapper">
      <div class="left-container">
        <div id="videoWrapper"></div>
        <div class="video-mask-box" :style="{ '--margin-width': `${blackWidth}px` }">
          <div class="label-mask" @mousedown.self="maskMousedown" @mouseup.self="maskMouseup"
            @mousemove.self="maskMousemove" :style="`background-image: url(${lastImageUrl});`">
            <div class="label-box" v-for="(litem, lindex) of currentTimeVideoLabelList" :key="'l-' + lindex"
              :style="{ inset: `${litem.y1}px calc(100% - ${litem.x2}px) calc(100% - ${litem.y2}px) ${litem.x1}px`, '--borderColor': litem._borderColor}">
              <span class="label-span" v-if="litem.x1 != litem.x2 && litem.y1 != litem.y2">{{ litem.label }}</span>
              <ui-icon class="label-box-close" @click.stop="handleDelLabel(lindex)">cancel</ui-icon>
            </div>
            <div class="label-box label-box-top" v-show="x1 != x2 && y1 != y2"
              :style="{ inset: `${y1}px calc(100% - ${x2}px) calc(100% - ${y2}px) ${x1}px`, '--borderColor': currentLabelBoxRender._borderColor }">
              <span class="label-span">{{ currentLabel }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="rigth-container">
        <div class="file-wrapper">
          <ui-card outlined class="file-card" style="height: 400px;" v-anchor>
            <div style="margin: 6px;">
              <ui-button style="width: 160px;" icon="folder_open" outlined @click="openFileSelect">选择视频</ui-button>
              <ui-button style="width: 160px;margin-left: 8px;" icon="clear" @click="cleanFileList">清空{{ fileList.length
                }}</ui-button>
              <ui-button style="float: right;" @click="openVideoConfig">播放配置</ui-button>
            </div>
            <ui-list class="file-list" :type="2" avatar style="height: 340px;overflow-y: auto;">
              <template v-for="(item, index) in fileList" :key="index">
                <ui-item-divider v-if="item === '-'" :key="index"></ui-item-divider>
                <ui-item v-else @click="selectVideo(item)" :selected="item == currentVideo">
                  <template #before="{ iconClass }">
                    <ui-icon :class="iconClass">movie</ui-icon>
                  </template>
                  <ui-item-text-content>
                    <ui-item-text1>{{ item.text }}</ui-item-text1>
                    <ui-item-text2>已标注：{{ labelResultMap.get(item) ? labelResultMap.get(item).length : 0
                      }}</ui-item-text2>
                  </ui-item-text-content>
                  <ui-item-last-content>
                    <ui-icon @click="deleteToList(item)">delete_outline</ui-icon>
                  </ui-item-last-content>
                </ui-item>
              </template>
            </ui-list>
          </ui-card>
        </div>
        <div class="label-wrapper">
          <ui-card outlined class="label-card" style="height: 380px;">
            <div style="margin: 6px;">
              <ui-button style="width: 100px;" icon="edit" outlined @click="editShortcut">快捷键</ui-button>
              <ui-button style="width: 160px;margin-left: 8px;" icon="save" outlined
                @click="saveLabelToFile">保存全部标注</ui-button>
              <ui-button style="width: 190px;margin-left: 8px;" icon="save_alt" outlined
                @click="saveCurrentVideoLabelToFile">保存当前视频标注</ui-button>
            </div>
            <ui-list :type="2" style="overflow-y: auto;">
              <ui-item v-for="(citem, cindex) in stortcutData" :key="'c-' + cindex">
                <ui-item-first-content>
                  <ui-icon :style="{color: citem.borderColor}">square</ui-icon>
                </ui-item-first-content>
                <ui-item-text-content>
                  <ui-item-text1>
                    {{ citem.label }}
                  </ui-item-text1>
                  <ui-item-text2>按键：{{ citem.shortcutLabel }}</ui-item-text2>
                </ui-item-text-content>
              </ui-item>
            </ui-list>
          </ui-card>
        </div>
      </div>
    </div>
    <div class="bottom-wrapper">
      <!-- 标注预览 -->
      <div class="preview-label-wrapper flex-row">
        <ui-card outlined class="preview-label-card" style="min-width: 200px;"
          v-for="(pitem, pindex) of currentVideoLabelMap" :key="'p-' + pindex">
          <div style="width: 100%;">
            <ui-button style="width: 50%;" @click="videoToTime(pitem[0])">跳转</ui-button>
            <ui-button style="width: 50%;" @click="delLabelByTime(pitem[0])">清除</ui-button>
          </div>
          <div style="margin: 6px;width: 188px;">
            <div class="flex-row flex-y-center">
              <ui-icon style="color: #bbbbbb;">query_builder</ui-icon>
              <span style="margin-left: 6px;">{{ pitem[0] }}s</span>
            </div>
            <div class="flex-row flex-y-center" v-for="(cpitem, cpindex) of pitem[1]" :key="'cp-' + cpindex">
              <ui-icon style="color: #bbbbbb;">label</ui-icon>
              <span style="margin-left: 6px;">{{ cpitem[0] }}</span>
              <ui-icon style="margin-left: 12px;font-size: 12px;">tag</ui-icon>
              <span>{{ cpitem[1] }}</span>
            </div>
          </div>
        </ui-card>
      </div>
    </div>
    <ui-dialog :model-value="showEditShortcut" :sheet="true" @close="showEditShortcut = false">
      <ui-dialog-title>编辑快捷键</ui-dialog-title>
      <ui-dialog-content>
        <div class="stortcut-wrapper">
          <div class="top-btns flex-row flex-y-center">
            <ui-textfield v-model="labelValue" :required="true" :class="{ 'demo-text-field-custom-colors': true }"
              helper-text-id="my-text-field-helper-text" @change="labelValueChange"
              @update:modelValue="labelValueChange">
              新的标签
            </ui-textfield>
            <div class="flex-row flex-y-center" style="margin-left: 16px;">
              <ui-spinner :active="bindLoading" size="M"></ui-spinner>
              <ui-button raised unelevated @click="handleBindKeyCode" :disabled="bindLoading">{{ bindLoading ?
                '等待按键' : '绑定快捷键' }}</ui-button>
            </div>
          </div>
          <div class="content">
            <ui-table :data="stortcutData" :thead="stortcutThead" :tbody="stortcutTbody" style="width: 400px;">
              <template #borderColor="{ data }">
                <ColorPicker v-model:pureColor="data.borderColor" @update:pureColor="val => data['borderColor']=val" @pureColorChange="handleColorChange" @gradientColorChange="handleColorChange" :disableAlpha="true"/>
              </template>
              <template #actions="{ data }">
                <ui-icon style="cursor: pointer;" @click="stortcutDel(data)">delete</ui-icon>
              </template>
            </ui-table>
          </div>
        </div>
      </ui-dialog-content>
    </ui-dialog>
    <ui-dialog :model-value="showVideoConfig" :sheet="true" @close="showVideoConfig = false">
      <ui-dialog-title>视频播放器配置</ui-dialog-title>
      <ui-dialog-content>
        <ui-form style="padding: 20px;">
          <ui-form-field>
            <ui-switch input-id="autoplay-switch" v-model="currentPlayerConfig.autoplay"></ui-switch><label
              for="autoplay-switch">是否自动播放</label>
          </ui-form-field>
          <ui-form-field style="margin-top: 16px;">
            <ui-switch input-id="autoplayMuted-switch" v-model="currentPlayerConfig.autoplayMuted"></ui-switch><label
              for="autoplayMuted-switch">是否静音播放</label>
          </ui-form-field>

        </ui-form>
      </ui-dialog-content>
    </ui-dialog>
  </div>
</template>

<script setup>
import Player, { Events } from 'xgplayer';
import 'xgplayer/dist/index.min.css';
import screenShot from '@/js/screenShot'
import { types, useToast, useConfirm } from 'balm-ui';
import { computed, h, reactive, ref, watch } from 'vue';

let player = null

const $toast = useToast();
const $confirm = useConfirm();
const toast = (message) => $toast({ message, position: 'top' })

const showEditShortcut = ref(false)

// 视频播放器配置
const blackWidth = ref(0)
const videoRate = ref(1)
const videoRealWidth = ref(0)
const videoRealHeight = ref(0)
const showVideoConfig = ref(false)
const initPlayerConfig = {
  id: 'videoWrapper',
  lang: 'zh',
  url: '',
  keyboard: {
    seekStep: 1,
    keyCodeMap: {
      'up': {
        action: function () {
          console.log('切换上个视频')
          switchVideo(currentVideo.value, -1)
          currentVideo.value = fileList[fileList.indexOf(currentVideo.value) - 1]
        }
      },
      'down': {
        action: function () {
          console.log('切换下个视频')
          switchVideo(currentVideo.value, 1)
        }
      }
    }
  },
  height: '800px',
  width: '1400px',
  // thumbnail: { // 预览
  //   "pic_num": 44,
  //   "width": 160,
  //   "height": 90,
  //   "col": 10,
  //   "row": 10,
  //   "urls": [""],
  // },
  closeVideoClick: true, // 单击关闭视频事件
  closeVideoDblclick: true, // 双击关闭视频事件
  marginControls: true, // 是否开启画面和控制栏分离模式
  closeFocusVideoFocus: false,
  controls: {
  },
  playbackRate: {
    list: [0.1, 0.5, 1, 2]
  },
  ignores: ['cssfullscreen', 'fullscreen']
}
const currentPlayerConfig = reactive({
  defaultPlaybackRate: 1,
  autoplay: true,
  autoplayMuted: true,
})
const currentVideoTime = ref(0)
// 当前视频对象
const currentVideo = ref(null)

// 文件资源列表
const fileList = reactive([])
// 根目录句柄
const rootDirHandler = ref(null)
// 当前视频文件句柄
const currentVideoDirHandler = ref(null)

// 标签结果列表
const labelResultMap = reactive(new Map([]))

// watch(labelResultMap, (val) => {
//   console.log('labelResultMap', val)
// })

// 快捷键列表
const stortcutData = reactive(localStorage.getItem('stortcutData') ? JSON.parse(localStorage.getItem('stortcutData')) : [])

const stortcutThead = reactive(['标签', '快捷键', '标注框颜色', '操作'])

const stortcutTbody = reactive(['label', 'shortcutLabel', { slot: 'borderColor' }, { slot: 'actions' }])

const labelValue = ref('')
const bindLoading = ref(false)

// 当前标签
const currentLabel = ref('')
const currentLabelBoxRender = reactive({
  label: null,
  _name: null,
  _time: null,
  _x: 0,
  _y: 0,
  _ox: 0,
  _oy: 0,
  _borderColor: 'red'
})

// 标注框列表
const currentVideoLabelList = computed(() => {
  if (!currentVideo.value) {
    return []
  }
  return labelResultMap.get(currentVideo.value) || []
})
const x1 = computed(() => {
  return Math.min(currentLabelBoxRender._x, currentLabelBoxRender._ox)
})
const x2 = computed(() => {
  return Math.max(currentLabelBoxRender._x, currentLabelBoxRender._ox)
})
const y1 = computed(() => {
  return Math.min(currentLabelBoxRender._y, currentLabelBoxRender._oy)
})
const y2 = computed(() => {
  return Math.max(currentLabelBoxRender._y, currentLabelBoxRender._oy)
})

const currentTimeVideoLabelList = computed(() => {
  if (!currentVideo.value) {
    return []
  }
  return labelResultMap.get(currentVideo.value)?.filter(i => i._time == currentVideoTime.value).map(i => {
    return {
      x1: Math.min(i._x, i._ox),
      x2: Math.max(i._x, i._ox),
      y1: Math.min(i._y, i._oy),
      y2: Math.max(i._y, i._oy),
      label: i.label,
      _borderColor: i._borderColor
    }
  }) || []
})

// 时间线标注预览
const currentVideoLabelMap = computed(() => {
  const _tempMap = new Map([])
  const _tempList = currentVideoLabelList.value
  if (_tempList.length) {
    _tempList.forEach(item => {
      const _tempKey = item.label
      if (_tempMap.has(item._time)) {
        if (_tempMap.get(item._time).has(_tempKey)) {
          const _tempPMap = _tempMap.get(item._time)
          _tempPMap.set(_tempKey, _tempPMap.get(_tempKey) + 1)
        } else {
          const _tempPMap = _tempMap.get(item._time)
          _tempPMap.set(_tempKey, 1)
        }
      } else {
        const _tempCMap = new Map([])
        _tempCMap.set(_tempKey, 1)
        _tempMap.set(item._time, _tempCMap)
      }
    })
  }
  return _tempMap
})

let lastVideoUrl = ''

// 快捷键列表
const keyCodeList = computed(() => {
  const keyCodes = []
  stortcutData.forEach(element => {
    if (element.keyCode2) {
      keyCodes.push(element.keyCode)
      keyCodes.push(element.keyCode2)
    } else {
      keyCodes.push(element.keyCode)
    }
  });
  return keyCodes
})

const handleColorChange = (val) => {
  localStorage.setItem('stortcutData', JSON.stringify(stortcutData))
  console.log("handleColorChange", val)
}

const currentVideoFileName = computed(() => {
  if (!currentVideo.value || !currentVideo.value.text) {
    return ''
  }
  return currentVideo.value.text.substring(0, currentVideo.value.text.lastIndexOf('\.'))
})

onMounted(() => {
  player = new Player({ ...initPlayerConfig, ...currentPlayerConfig });
  listenKeydownEvent();
  listenPageEvent();
});

// 资源浏览器==================
const selectVideo = async (item) => {
  switchVideo(item)
}

const deleteToList = (item) => {
  fileList.splice(fileList.indexOf(item), 1)
}

const cleanFileList = () => {
  fileList.splice(0, fileList.length)
}

// 选择视频文件夹
const openFileSelect = async () => {
  // 1、打开文件选择器
  if (!showDirectoryPicker) {
    toast('当前浏览器不支持')
    return
  }
  try {
    const rootHandler = await showDirectoryPicker()
    rootHandler.requestPermission({ mode: 'readwrite' }).then(async res => {
      if (res == 'granted') {
        toast('获取目录权限成功')
        // 创建一个标注主文件
        rootDirHandler.value = await rootHandler.getDirectoryHandle(`build-labels`, { create: true })
      } else {
        toast('获取目录权限失败:' + res)
      }
    }).catch(err => {
      toast('获取目录权限失败:' + err)
    })
    fileList.splice(0, fileList.length)
    await progressHandle(rootHandler)
    if (fileList.length == 0) {
      toast('目录文件为空')
    }
  } catch (error) {
    toast('获取目录失败:' + error)
  }

}

async function progressHandle(handler) {
  if (handler.kind == 'file') {
    fileList.push({
      text: handler.name,
      count: 0,
      handler
    })
    return
  }
  const iter = handler.entries();
  for await (const item of iter) {
    await progressHandle(item[1])
  }
}

// 视频播放器 ===============
const openVideoConfig = () => {
  showVideoConfig.value = true
}

// 快捷键================
const editShortcut = () => {
  showEditShortcut.value = true
}

const labelValueChange = (val) => {
  if (!val) {
    bindLoading.value = false
  }
}

const getLabelBorderColor = (label) => {
  if(!label) {
    return "red"
  }
  return stortcutData.find(i=> i.label == label).borderColor
}

// 绑定快捷键监听按键事件
const handleBindKeyCode = () => {
  if (labelValue.value) {
    bindLoading.value = true
    document.addEventListener('keypress', (e) => {
      if (!bindLoading.value) { // 非绑定状态跳过
        return
      }
      if (e.keyCode == 16 || e.keyCode == 17 || e.keyCode == 18) {
        return
      }
      stortcutData.push({
        label: labelValue.value,
        keyCode: e.keyCode,
        keyCode2: e.keyCode >= 97 ? e.keyCode - 32 : e.keyCode + 32,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        borderColor: 'red',
        shortcutLabel: (e.ctrlKey ? 'Ctrl+' : '') + (e.altKey ? 'Alt+' : '') + (e.shiftKey ? 'Shift+' : '') + e.key.toLocaleUpperCase()
      })
      localStorage.setItem('stortcutData', JSON.stringify(stortcutData))
      toast('绑定成功')
      bindLoading.value = false
      document.removeEventListener('keydown')
    })
  } else {
    toast('请输入标签')
  }
}

const stortcutDel = (item) => {
  stortcutData.splice(stortcutData.indexOf(item), 1)
  localStorage.setItem('stortcutData', JSON.stringify(stortcutData))
}

// 监听按键事件================
const listenKeydownEvent = () => {
  document.addEventListener('keypress', (e) => {
    // e.preventDefault()
    if (e.keyCode == 16 || e.keyCode == 17 || e.keyCode == 18 || bindLoading.value || !keyCodeList.value.includes(e.keyCode)) {
      return
    }
    requestAnimationFrame(() => {
      for (const key in stortcutData) {
        if (Object.hasOwnProperty.call(stortcutData, key)
          && (stortcutData[key].keyCode == e.keyCode || stortcutData[key].keyCode2 == e.keyCode)) {
          const element = stortcutData[key];
          currentLabel.value = element.label
          toast(`标签：${element.label} [快捷键 ${element.shortcutLabel}]`)
          if (labelResultMap.has(currentVideo.value) && labelResultMap.get(currentVideo.value)) {
            labelResultMap.get(currentVideo.value).forEach(i => {
              if (!i.label) {
                i.label = currentLabel.value
                i._borderColor = getLabelBorderColor(currentLabel.value)
                toast(`标注成功：${i.label}`)
              }
            })
          }
          return
        }
      }

    })
  })
  document.addEventListener('keydown', (e) => {
    if (e.keyCode == 116) { //禁止F5刷新
      e.preventDefault()
      toast('已禁用F5刷新')
      return
    }
  })
  document.oncontextmenu = function (e) {
    return false
  }
}

// 页面改变事件=============
const listenPageEvent = () => {
  window.addEventListener('beforeunload', function (event) {
    // 设置returnValue属性可以显示一个提示信息，询问用户是否确实要离开页面
    event.returnValue = '您确定要离开这个页面吗？';
  });
}

// 标注====================
let mousedownFlag = false

const maskMousedown = (e) => {
  if (!currentVideo.value) {
    toast('请选择视频')
    return
  }
  if (!player.paused) {
    toast('请先暂停视频')
    return
  }
  mousedownFlag = true
  currentLabelBoxRender._x = e.offsetX
  currentLabelBoxRender._y = e.offsetY
  currentLabelBoxRender._ox = e.offsetX
  currentLabelBoxRender._oy = e.offsetY
  currentLabelBoxRender._borderColor = getLabelBorderColor(currentLabel.value)
}

// 完成单次标注
const maskMouseup = (e) => {
  if (!mousedownFlag) {
    return
  }
  if (!currentVideo.value) {
    toast('请选择视频')
    return
  }
  toast(`标注成功：${player.currentTime}s`)
  mousedownFlag = false

  if (currentLabelBoxRender._x === e.offsetX || currentLabelBoxRender._y === e.offsetY) {
    toast('标注失败：标注框大小不能小于0')
    return
  }

  const key = currentVideo.value
  const _tempLabelItem = {
    label: currentLabel.value,
    _name: key.text,
    _time: player.currentTime,
    _x: currentLabelBoxRender._x,
    _y: currentLabelBoxRender._y,
    _ox: e.offsetX,
    _oy: e.offsetY,
    _borderColor: currentLabelBoxRender._borderColor,
    videoWidth: player._videoWidth,
    videoHeight: player._videoHeight,
    x1: currentLabelBoxRender._x * videoRate.value,
    y1: currentLabelBoxRender._y * videoRate.value,
    x2: e.offsetX * videoRate.value,
    y2: e.offsetX * videoRate.value,
  }
  // 设置标注map
  if (labelResultMap.has(key)) {
    labelResultMap.get(key).push(_tempLabelItem)
  } else {
    labelResultMap.set(key, [_tempLabelItem])
  }

  currentLabelBoxRender._x = 0
  currentLabelBoxRender._y = 0
  currentLabelBoxRender._ox = 0
  currentLabelBoxRender._oy = 0

  // 截图测试
  screenShot(player, {
    quality: 1,
    fileName: `${player.currentTime}`
  })

  player.screenShot(currentVideoDirHandler.value, `${player.currentTime}`)

  // 请输入标签快捷键
  if (!currentLabel.value) {
    toast('请输入标签快捷键')
  }
}

const maskMousemove = (e) => {
  if (!mousedownFlag) {
    return
  }
  if (!currentVideo.value) {
    toast('请选择视频')
    return
  }
  currentLabelBoxRender._ox = e.offsetX
  currentLabelBoxRender._oy = e.offsetY
}

// 当前时间戳
const getCurrentTimeStr = () => new Date().getTime().toString()

// 全部视频的标注
const saveLabelToFile = async () => {
  if (labelResultMap.size == 0) {
    toast('暂未标注，无法保存')
    return
  }
  const labelDirHandler = await rootDirHandler.value.getDirectoryHandle('labels', { create: true })

  labelResultMap.forEach((value, key) => {
    const _videoName = key.text.substring(0, key.text.lastIndexOf('\.'))
    const fileName = `${_videoName}.json`

    // 处理标注分组根据time
    const jsonObject = {}
    value.forEach(i => {
      const timeStr = `${i._time}.png`
      if (!jsonObject[timeStr]) {
        jsonObject[timeStr] = []
      }
      jsonObject[timeStr].push(i)
    })

    const jsonString = JSON.stringify(jsonObject, null, 2);
    const fileBlob = new Blob([jsonString], { type: 'application/json' });

    // 保存文件到标注文件夹中
    labelDirHandler.getFileHandle(fileName, { create: true }).then(fileHandle => {
      fileHandle.createWritable().then(writable => {
        writable.write(fileBlob).then(() => {
          writable.close();
          toast(`保存全部视频标注成功：${fileName}`)
        });
      });
    });
  })
}

// 仅保存当前视频标注
const saveCurrentVideoLabelToFile = async () => {
  if (labelResultMap.size == 0) {
    toast('暂未标注，无法保存')
    return
  }
  const labelDirHandler = await rootDirHandler.value.getDirectoryHandle('labels', { create: true })

  const key = currentVideo.value

  const value = labelResultMap.get(key)

  const _videoName = key.text.substring(0, key.text.lastIndexOf('\.'))
  const fileName = `${_videoName}.json`

  // 处理标注分组根据time
  const jsonObject = {}
  value.forEach(i => {
    const timeStr = `${i._time}.png`
    if (!jsonObject[timeStr]) {
      jsonObject[timeStr] = []
    }
    jsonObject[timeStr].push(i)
  })

  const jsonString = JSON.stringify(jsonObject, null, 2);
  const fileBlob = new Blob([jsonString], { type: 'application/json' });

  // 保存文件到标注文件夹中
  labelDirHandler.getFileHandle(fileName, { create: true }).then(fileHandle => {
    fileHandle.createWritable().then(writable => {
      writable.write(fileBlob).then(() => {
        writable.close();
        toast(`保存当前视频标注成功：${fileName}`)
      });
    });
  });
}

const handleDelLabel = (index) => {
  labelResultMap.get(currentVideo.value)?.splice(index, 1)
}

let lastImageUrl = ref(null)

// 跳转标注时间
const videoToTime = async (time) => {
  console.log(`跳转到时间:${time}`)
  player.pause()
  player.currentTime = time
  // 获取本地截图URL
  const _currentTimeFile = await currentVideoDirHandler.value.getFileHandle(`${time}.png`, { create: false })
  const _file = await _currentTimeFile.getFile()
  if (_file.type.startsWith('image/')) {
      var URL = window.URL || window.webkitURL;
      if (lastImageUrl.value) {
        URL.revokeObjectURL(lastImageUrl.value)
      }
      lastImageUrl.value = URL.createObjectURL(_file);
    } else {
      toast("该文件不是图片类型")
    }
}

// 清除标注
const delLabelByTime = (time) => {
  labelResultMap.get(currentVideo.value).forEach(i => {
    if (i._time == time) {
      labelResultMap.get(currentVideo.value).splice(labelResultMap.get(currentVideo.value).indexOf(i), 1)
    }
  })
}

// 初始化视频播放==================
let videoInitLoading = false

const initVideoPlayer = () => {
  if (videoInitLoading) {
    return
  }
  videoInitLoading = true
  player.reset()
  player = null
  const _tempConfig = { ...initPlayerConfig, ...currentPlayerConfig }
  console.log(_tempConfig)
  player = new Player(_tempConfig);
  if (player.config.autoplay) {
    console.log(player.config)
    setTimeout(() => {
      player.play().then(() => {
        // 播放成功
        console.log("播放成功")
      }).catch((err) => {
        // 播放失败，一般发生于未经用户交互时的自动播放
        console.error(err)
      })
    }, 200)
  }

  // 监听事件
  player.on(Events.RATE_CHANGE, () => {
    if (videoInitLoading) {
      return
    }
    console.log(`视频播放倍率改变：${player.playbackRate}X`)
    currentPlayerConfig.defaultPlaybackRate = player.playbackRate
  })
  player.on(Events.TIME_UPDATE, () => {
    if (videoInitLoading) {
      return
    }
    currentVideoTime.value = player.currentTime
    console.log(`视频时间改变${player.currentTime}`)
  })
  player.on(Events.PLAY, () => {
    if(lastImageUrl.value) {
      console.log("移除截图")
      URL.revokeObjectURL(lastImageUrl.value)
      lastImageUrl.value = null
    }
  })
  player.on(Events.LOADED_DATA, () => {
    // 1、计算黑边宽度
    requestAnimationFrame(() => {
      console.log("LOADED_DATA", player._videoHeight, player.sizeInfo.height)
      videoRate.value = player._videoHeight / (player.sizeInfo.height - 48)
      videoRealWidth.value = player._videoWidth / videoRate.value
      videoRealHeight.value = player.sizeInfo.height - 48
      blackWidth.value = (player.sizeInfo.width - videoRealWidth.value) / 2
    })
  })
  videoInitLoading = false
}

// 切换视频 -1=上个视频 1=下个视频
const switchVideo = async (video, flag = 0) => {
  const _currentItem = fileList[fileList.indexOf(video) + flag]
  if (!_currentItem.handler) {
    toast('文件句柄失效')
    return
  }
  initVideoPlayer()
  try {
    const file = await _currentItem.handler.getFile()
    if (file.type.startsWith('video/')) {
      var URL = window.URL || window.webkitURL;
      if (lastVideoUrl) {
        URL.revokeObjectURL(lastVideoUrl)
      }
      lastVideoUrl = URL.createObjectURL(file);
      // player.src = lastVideoUrl;
      player.switchURL(lastVideoUrl)
      currentVideo.value = _currentItem

      console.log('player', player)
      // 创建视频标注文件夹
      currentVideoDirHandler.value = await rootDirHandler.value.getDirectoryHandle(currentVideoFileName.value, { create: true })
    } else {
      alert(' selected file is not a valid video file.');
    }
  } catch (error) {
    console.log(error)
    toast('文件读取失败')
  }
}
</script>

<style lang="scss" scoped>
.main-container {
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .main-wrapper {
    width: 100%;
    height: 90%;
    display: flex;
    justify-content: space-between;

    .left-container {
      margin: 6px;
      position: relative;
      user-select: none;

      .video-mask-box {
        --margin-width: 0px;
        width: calc(100% - calc(var(--margin-width) * 2));
        height: calc(100% - 48px);
        margin: 0 var(--margin-width); // 动态修改
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1;
        overflow: hidden;

        .label-mask {
          width: 100%;
          height: 100%;
          background-size: 100%;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 1;
          overflow: hidden;

          .label-box {
            --borderColor: red;
            position: absolute;
            inset: 0;
            background-color: #2222221a;
            box-shadow: 0 0 0 1px var(--borderColor) inset;
            pointer-events: none;
            z-index: 2;

            .label-span {
              background-color: var(--borderColor);
              color: white;
            }

            .label-box-close {
              font-size: 18px;
              color: #c1c1c1;
              position: absolute;
              right: -10px;
              top: -10px;
              background-color: #ffffff;
              border-radius: 50%;
              pointer-events: auto;
              cursor: pointer;
              z-index: 5;

              &:hover {
                animation: hoverAnimation 0.2s ease-in-out forwards;
              }
            }

            @keyframes hoverAnimation {
              0% {
                transform: scale(1);
              }

              100% {
                transform: scale(1.2);
                color: #999999;
              }
            }
          }

          .label-box-top {
            z-index: 3;
          }
        }

      }


    }

    .rigth-container {
      padding: 6px;
      flex: 1;
      user-select: none;
      width: 480px;
      max-width: 494px;

      .file-wrapper {
        width: 100%;

        .file-card {
          width: 100%;

        }
      }

      .label-wrapper {
        margin-top: 12px;
        width: 100%;

        .label-card {
          width: 100%;
        }
      }
    }
  }

  .bottom-wrapper {
    flex: 1;
    width: 100vw;
    height: calc(100vh - 812px);

    .preview-label-wrapper {
      padding: 6px;
      width: calc(100% - 12px);
      height: 100%;
      overflow-x: auto;

      .preview-label-card {
        height: 100px;
        width: 200px;
        overflow-y: auto;
        overflow-x: hidden;
      }
    }
  }

  .stortcut-wrapper {
    .top-btns {}

    .content {
      width: 400px;
      margin-top: 12px;
    }
  }
}
</style>