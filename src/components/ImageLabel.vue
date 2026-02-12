<template>
  <div class="main-container">
    <div class="main-wrapper">
      <div class="left-container">
        <div id="imageWrapper">
          <img ref="imageRef" v-if="currentImage.url" id="image" :src="currentImage.url" height="800" />
          <span v-else>请选择图片</span>
        </div>
        <ImageLabelMaskBox ref="imageLabelMaskBoxRef" :width="1400" :height="800" :blackWidth="blackWidth" :imgUrl="currentImage.url" :labelOptions="{
          type: labelType,
          label0AutoNext: label0AutoNext,
          label: currentLabel,
          labelColor: currentLabelColor
        }" @get="handleLabelChange" @next="switchImage(currentImage, 1)"></ImageLabelMaskBox>
      </div>
      <div class="rigth-container">
        <div class="file-wrapper">
          <ui-card outlined class="file-card" style="height: 400px;" v-anchor>
            <div style="margin: 6px;">
              <ui-button style="width: 160px;" icon="folder_open" outlined @click="openFileSelect">选择图片</ui-button>
              <ui-button style="width: 160px;margin-left: 8px;" icon="clear" @click="cleanFileList">清空{{ fileList.length
                }}</ui-button>
              <ui-button style="float: right;" @click="openImageConfig">标注配置</ui-button>
            </div>
            <ui-list class="file-list" :type="2" avatar style="height: 340px;overflow-y: auto;">
              <template v-for="(item, index) in fileList.filter(f => f.url)" :key="index">
                <ui-item-divider v-if="item === '-'" :key="index"></ui-item-divider>
                <ui-item v-else @click="selectImage(item)" :selected="item == currentImage">
                  <template #before="{ iconClass }">
                    <ui-icon :class="iconClass">image</ui-icon>
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
                @click="saveCurrentImageLabelToFile">保存当前图片标注</ui-button>
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
        <ui-card outlined class="preview-label-card"
          v-for="(pitem, pindex) of labelResultMap" :key="'p-' + pindex">
          <div style="width: 100%;display: flex;">
            <ui-button style="width: 50%;" @click="delLabelByTime(pitem[0])">清除</ui-button>
          </div>
          <div style="background-color: #000;cursor: pointer;user-select: none;" @click="previewLabel(pitem[0])">
            <img :src="pitem[0].url" height="94"/>
            <!-- <span>{{ pitem[0] }}</span> -->
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
    <ui-dialog :model-value="showImageConfig" :sheet="true" @close="showImageConfig = false">
      <ui-dialog-title>标注类型配置</ui-dialog-title>
      <ui-dialog-content>
        <ui-form style="padding: 20px;width: 350px;">
          <ui-form-field>
            <ui-radio v-model="labelType" inputId="label0" value="label0" :attrs="{name: 'labelType'}"></ui-radio>
            <label for="label0" style="cursor: pointer;">单标签标注</label>
            
          </ui-form-field>
          <div v-if="labelType == 'label0'" style="margin-bottom: 16px;margin-left: 40px;">
            <ui-switch v-model="label0AutoNext" id="label0AutoNext"></ui-switch>
            <label style="padding-left: 8px;cursor: pointer;" for="label0AutoNext">单标签标注完成切换下一图片</label>
          </div>
          <ui-form-field>
            <ui-radio v-model="labelType" inputId="label1" value="label1" :attrs="{name: 'labelType'}"></ui-radio>
            <label for="label1" style="cursor: pointer;">多标签标注</label>
          </ui-form-field>
          <ui-form-field>
            <ui-radio v-model="labelType" inputId="label2" value="label2" :attrs="{name: 'labelType'}"></ui-radio>
            <label for="label2" style="cursor: pointer;">多边型标注</label>
          </ui-form-field>
          
        </ui-form>
      </ui-dialog-content>
    </ui-dialog>
  </div>
</template>

<script setup>
import screenShot from '@/js/screenShot'
import { types, useToast, useConfirm, useAlert } from 'balm-ui';
import { computed, reactive, ref, watch, onMounted, onUnmounted } from 'vue';
import ImageLabelMaskBox from './ImageLabelMaskBox.vue';

const $toast = useToast();
const $confirm = useConfirm();
const $alert = useAlert();
const toast = (message) => $toast({ message, position: 'top' })

const showEditShortcut = ref(false)

// 图片播放器配置
const blackWidth = ref(0)
const imageRate = ref(1)
const imageRealWidth = ref(0)
const imageRealHeight = ref(0)
const showImageConfig = ref(false)
const labelType = ref('label0')
const label0AutoNext = ref(false)
const imageLabelMaskBoxRef = ref(null)

// 当前图片对象
const currentImage = ref({})
const imageRef = ref()

// 文件资源列表
const fileList = reactive([])
// 根目录句柄
const rootDirHandler = ref(null)
// 当前图片文件句柄
const currentImageDirHandler = ref(null)

// 标签结果列表
const labelResultMap = reactive(new Map([]))

watch(labelType, (val) => {
  console.log('labelType', val)
})

// 快捷键列表
const stortcutData = reactive(localStorage.getItem('stortcutData') ? JSON.parse(localStorage.getItem('stortcutData')) : [])

const stortcutThead = reactive(['标签', '快捷键', '标注框颜色', '操作'])

const stortcutTbody = reactive(['label', 'shortcutLabel', { slot: 'borderColor' }, { slot: 'actions' }])

const labelValue = ref('')
const bindLoading = ref(false)

// 当前标签
const currentLabel = ref('')

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

const currentLabelColor = computed(() => {
  if(!currentLabel.value) {
    return "red"
  }
  return stortcutData.find(i=> i.label == currentLabel.value).borderColor
})

const handleColorChange = (val) => {
  localStorage.setItem('stortcutData', JSON.stringify(stortcutData))
  console.log("handleColorChange", val)
}

const currentImageFileName = computed(() => {
  if (!currentImage.value || !currentImage.value.text) {
    return ''
  }
  return currentImage.value.text.substring(0, currentImage.value.text.lastIndexOf('\.'))
})

onMounted(() => {
  listenKeydownEvent();
  listenPageEvent();
});

onUnmounted(() => {
  fileList.forEach(item => {
    URL.revokeObjectURL(item.url)
  })
})

// 资源浏览器==================
const selectImage = async (item) => {
  switchImage(item)
  if(labelResultMap.has(item)) {
    imageLabelMaskBoxRef.value.initLabelMaskBox(labelResultMap.get(item))
  } else {
    imageLabelMaskBoxRef.value.initLabelMaskBox()
  }
}

const deleteToList = (item) => {
  fileList.splice(fileList.indexOf(item), 1)
}

const cleanFileList = () => {
  fileList.splice(0, fileList.length)
}

// 选择图片文件夹
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

        for await (const key of rootHandler.keys()) {
          if(key == 'build-labels') {
            const confirmRes = await $confirm({
              title: '警告',
              message: '检测到目录中已存在标注主文件，是否继续？',
              acceptText: '继续',
              cancelText: '重新开始',
            })
            if(!confirmRes) {
              await rootHandler.removeEntry('build-labels', { recursive: true })
              $toast({
                message:'重建标注主文件成功',
                position: 'top',
                state: 'success'
              })
            }
            break
          }
        }
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
    } else {
      requestIdleCallback(createImageUrl)
      console.log('初始化文件列表',fileList)
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
      url: '',
      handler
    })
    return
  }
  const iter = handler.entries();
  for await (const item of iter) {
    await progressHandle(item[1])
  }
}

// 空闲时间执行
let startIndex = 0
async function createImageUrl(deadline) {
  const fileItem = fileList[startIndex]
  while(startIndex < fileList.length - 1 
    && !fileItem.url
    && (deadline.timeRemaining() > 0 || deadline.didTimeout)) {
    const file = await fileItem.handler.getFile()
    if(file.type.startsWith('image/')) {
      fileItem.url = URL.createObjectURL(file)
    }
    startIndex++
  }
  if(startIndex < fileList.length - 1) {
    requestIdleCallback(createImageUrl)
  }
}

// 图片播放器 ===============
const openImageConfig = () => {
  showImageConfig.value = true
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
          if (labelResultMap.has(currentImage.value) && labelResultMap.get(currentImage.value)) {
            labelResultMap.get(currentImage.value).forEach(i => {
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

// 全部图片的标注
const saveLabelToFile = async () => {
  if (labelResultMap.size == 0) {
    toast('暂未标注，无法保存')
    return
  }
  const labelDirHandler = await rootDirHandler.value.getDirectoryHandle('labels', { create: true })

  labelResultMap.forEach((value, key) => {
    const _imageName = key.text.substring(0, key.text.lastIndexOf('\.'))
    const fileName = `${_imageName}.json`

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
          toast(`保存全部图片标注成功：${fileName}`)
        });
      });
    });
  })
}

// 仅保存当前图片标注
const saveCurrentImageLabelToFile = async () => {
  if (labelResultMap.size == 0) {
    toast('暂未标注，无法保存')
    return
  }
  const labelDirHandler = await rootDirHandler.value.getDirectoryHandle('labels', { create: true })

  const key = currentImage.value

  const value = labelResultMap.get(key)

  const _imageName = key.text.substring(0, key.text.lastIndexOf('\.'))
  const fileName = `${_imageName}.json`

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
        toast(`保存当前图片标注成功：${fileName}`)
      });
    });
  });
}

// 清除标注
const delLabelByTime = (_currentImage) => {
  labelResultMap.delete(_currentImage)
  imageLabelMaskBoxRef.value.initLabelMaskBox([])
}

const previewLabel = (item) => {
  switchImage(item)
  if(labelResultMap.has(item)) {
    imageLabelMaskBoxRef.value.initLabelMaskBox(labelResultMap.get(item))
  } else {
    imageLabelMaskBoxRef.value.initLabelMaskBox()
  }
}

const handleLabelChange = (labelList) => {
  console.log('handleLabelChange', labelList)
  labelResultMap.set(currentImage.value, [...labelList])
}

// 切换图片 -1=上个图片 1=下个图片
const switchImage = async (image, flag = 0) => {
  console.log('switchImage')
  const _currentItem = fileList[fileList.indexOf(image) + flag]
  if (!_currentItem || !_currentItem.handler) {
    toast('文件失效')
    return
  }
  try {
    currentImage.value = _currentItem

    // 创建图片标注文件夹
    currentImageDirHandler.value = await rootDirHandler.value.getDirectoryHandle(currentImageFileName.value, { create: true })

    // 获取图片尺寸-计算黑边宽度
    requestAnimationFrame(() => {
      try {
        const img = new Image()
        img.src = _currentItem.url
        img.onload = () => {
          console.log('图片加载完成', img.height, img.width)
          imageRate.value = img.height / 800
          imageRealWidth.value = img.width / imageRate.value
          imageRealHeight.value = 800
          blackWidth.value = (1400 - imageRealWidth.value) / 2
        }
      } catch (e) {
        console.log('获取图片尺寸', e)
      }
    })
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

      #imageWrapper {
        height: 800px;
        width: 1400px;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #000000;
        color: #ffffff;
      }

      .image-mask-box {
        --margin-width: 0px;
        width: calc(100% - calc(var(--margin-width) * 2));
        height: calc(100%);
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
    min-height: calc(100vh - 812px);
    display: flex;
    flex-direction: column;

    .preview-label-wrapper {
      flex: 1;
      padding: 6px;
      padding-top: 0;
      width: calc(100% - 12px);
      height: calc(100% - 6px);
      overflow-x: auto;
      gap: 4px;

      .preview-label-card {
        height: 136px;
        width: 136px;
        text-align: center;
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