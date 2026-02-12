<template>
  <div class="mask-box" :style="{ '--margin-width': `${blackWidth}px` }">
    <!-- 渲染底部绘制历史canvas -->
    <canvas id="canvas0" :width="canvasWidth" :height="props.height" :style="{width: `${canvasWidth}px`, height: `${props.height}px`}"></canvas>
    <canvas id="canvas" :width="canvasWidth" :height="props.height" :style="{width: `${canvasWidth}px`, height: `${props.height}px`}" 
      @mousedown.self="maskMousedown" @mouseup.self="maskMouseup" @mousemove.self="maskMousemove">
    </canvas>
    <ui-icon class="icon-close" v-for="(item, index) in labelList" :key="'c-' + index" :style="getCloseIconStyle(item)"
      @click.stop="handleDelLabel(index)">cancel</ui-icon>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useToast } from 'balm-ui';
const $toast = useToast();
const toast = (message) => $toast({ message, position: 'top' })

const props = defineProps({
  width: {
    type: Number,
    default: 1400
  },
  height: {
    type: Number,
    default: 800
  },
  blackWidth: { // 单边黑块宽度
    type: Number,
    default: 0
  },
  imgUrl: {
    type: String,
    default: ''
  },
  labelOptions: {
    type: Object,
    default: () => {
      return {
        type: 'label0', // 标注类型 label0-单标注
        label0AutoNext: true,
        label: '',
        labelColor: 'red'
      }
    }
  },
  beforeCallback: {
    type: Function,
    default: () => {}
  }
})

const emits = defineEmits(['get', 'next'])

let canvas0 = null
let ctx0 = null
let canvas = null
let ctx = null
const dpr = window.devicePixelRatio || 1

const currentLabelBoxRender = reactive({
  xy: [], // 格式：[[x1,y1], [x2,y2]]
  label: props.labelOptions.label,
  _type: props.labelOptions.type,
  _borderColor: props.labelOptions.labelColor
})

// 历史标注列表
const labelList = ref([])

const canvasWidth = computed(() => {
  return props.width - (props.blackWidth * 2)
})

watch(labelList, (list) => {
  console.log('labelList', list)
  if(['label0','label1'].includes(props.labelOptions.type)) {
    ctx0.clearRect(0, 0, canvas0.width, canvas0.height);
    for(const item of list) {
      drawRect(item, ctx0)
    }
  }
}, {deep: true})

onMounted(() => {
  console.log('initLabelMaskBox')
  canvas0 = document.getElementById('canvas0')
  ctx0 = canvas0.getContext('2d')
  canvas = document.getElementById('canvas')
  ctx = canvas.getContext('2d')
  initLabelMaskBox()
})

// 初始化标注状态
const initLabelMaskBox = (labels = []) => {
  ctx0.clearRect(0, 0, canvas0.width, canvas0.height);
  // requestAnimationFrame(() => {
  //   const img = new Image();
  //   img.onload = () => {
  //     ctx0.drawImage(img, 0, 0, canvas0.width, canvas0.height)
  //   }
  //   img.src = props.imgUrl
  // })
  resetLabelMask()
  labelList.value = labels
  for(const item of labels) {
    drawRect(item, ctx0)
  }
}

// 标注====================
let mousedownFlag = false

// 鼠标按下
const maskMousedown = (e) => {
  if (!props.beforeCallback && typeof props.beforeCallback == 'function') {
    props.beforeCallback()
  }
  if(props.labelOptions.type == 'label0' && labelList.value.length > 0) {
    toast('当前标注模式：单标签方式；无法增加标注')
    return
  }
  mousedownFlag = true
  const pos = getCanvasPos(e);
  currentLabelBoxRender.xy = [[pos.x, pos.y]]
  currentLabelBoxRender.label = props.labelOptions.label,
  currentLabelBoxRender._type = props.labelOptions.type,
  currentLabelBoxRender._borderColor = props.labelOptions.labelColor
}

// 完成单次标注
const maskMouseup = (e) => {
  if (!mousedownFlag) {
    return
  }
  mousedownFlag = false
  const pos = getCanvasPos(e);
  if (props.labelOptions.type == 'label2') {
    drawPolygon(currentLabelBoxRender)
  }
  if (props.labelOptions.type != 'label2' && currentLabelBoxRender.xy[0][0] === pos.x || currentLabelBoxRender.xy[0][1] === pos.y) {
    toast('标注失败：标注框大小不能小于0')
    return
  }

  // 加入标注列表中
  labelList.value.push({...currentLabelBoxRender})

  // 设置标注map
  emits('get', labelList.value)
  currentLabelBoxRender.xy = []

  // 截图测试

  // 请输入标签快捷键
  if (!props.labelOptions.label) {
    toast('请输入标签快捷键')
  }
  if(props.labelOptions.type == 'label0' && props.labelOptions.label0AutoNext) {
    toast('单标注完成，自动切换下一张图片')
    resetLabelMask()
    emits('next')
  }
}

const maskMousemove = (e) => {
  if (!mousedownFlag) {
    return
  }
  
  if (['label0', 'label1'].includes(props.labelOptions.type)) {
    const pos = getCanvasPos(e);
    // 清除上一帧
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    currentLabelBoxRender.xy.splice(1, 1, [pos.x, pos.y])
    drawRect(currentLabelBoxRender)
  }
}

const handleDelLabel = (index) => {
  labelList.value?.splice(index, 1)
  resetCurrLabelMask()
}

// 清除全部历史标注
const resetLabelMask = () => {
  labelList.value = []
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

// 清空当前标注
const resetCurrLabelMask = () => {
  Object.assign({
    xy: [], // 格式：[[x1,y1], [x2,y2]]
    label: props.labelOptions.label,
    _type: props.labelOptions.type,
    _borderColor: props.labelOptions.labelColor
  }, currentLabelBoxRender)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  console.log(labelList.value)
  emits('get', labelList.value)
}

const getCloseIconStyle = (_labelOptions) => {
  console.log('getCloseIconStyle', _labelOptions)
  if (_labelOptions.xy.length < 2) {
    return {
      display: 'none'
    }
  }
  return {
    top: `${Math.min(_labelOptions.xy[0][1],_labelOptions.xy[1][1]) - 16}px`,
    left: `${Math.max(_labelOptions.xy[0][0], _labelOptions.xy[1][0])}px`,
  }
}

// 获取Canvas内相对坐标（考虑滚动和偏移）
function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

// canvas 相关
// 绘制矩形
const drawRect = (currLabel = {}, _ctx) => {
  _ctx = _ctx || ctx
  _ctx.beginPath();
  _ctx.strokeStyle = currLabel._borderColor // 红色边框 [[5]]
  _ctx.lineWidth = 2;
  const x1 = currLabel.xy[0][0]
  const y1 = currLabel.xy[0][1]
  const x2 = currLabel.xy[1][0]
  const y2 = currLabel.xy[1][1]
  const w = x2 - x1
  const h = y2 - y1
  _ctx.rect(Math.min(x1, x2), Math.min(y1, y2), 16 * (currLabel.label && currLabel.label.length), 16)
  _ctx.fillStyle = currLabel._borderColor
  _ctx.fill()
  drawText(Math.min(x1, x2), Math.min(y1, y2), currLabel.label)
  _ctx.rect(Math.min(x1, x2), Math.min(y1, y2), w > 0 ? w: -w, h > 0 ? h: -h)
  _ctx.stroke();
}

// 绘制多边形
const drawPolygon = (currLabel = {}, _ctx) => {
  _ctx = _ctx || ctx
  _ctx.beginPath();
  _ctx.strokeStyle = currLabel._borderColor
  _ctx.lineWidth = 2;
  _ctx.moveTo(currLabel.xy[0][0], currLabel.xy[0][1]);
  for (let i = 1; i < currLabel.xy.length; i++) {
    _ctx.lineTo(currLabel.xy[i][0], currLabel.xy[i][1]);
  }
  _ctx.stroke();
}

// 绘制文字
function drawText(x, y, text, _ctx) {
  _ctx = _ctx || ctx
  _ctx.font = '16px Arial';
  _ctx.fillStyle = '#fff';
  _ctx.textBaseline = 'top';
  _ctx.fillText(text, x + 3, y + 2);
}

defineExpose({
  initLabelMaskBox,
  resetLabelMask
})
</script>

<style lang="scss" scoped>

.mask-box {
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

    }

    .label-box-top {
      z-index: 3;
    }
  }

  #canvas0, #canvas {
    position: absolute;
    top: 0;
    left: 0;
  }

  .icon-close {
    font-size: 18px;
    color: #c1c1c1;
    position: absolute;
    left: 0;
    top: 0;
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

</style>