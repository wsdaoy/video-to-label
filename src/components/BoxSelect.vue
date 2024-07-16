<template>
  <div class="box-select__container" @mousedown.left="mouseDown" @mousemove.stop="mouseMove" :class="uuid">
    <div class="box-select__coordinate" :style="style" ref="selectContainer"></div>
    <slot></slot>
  </div>
</template>

<script>
import { debounce, isNumber } from "lodash"

/**
 * @description 判断元素是否在范围内
 * @param {Object} dom dom元素
 */
const isWithinRange = (dom, top, bottom, left, right) => {
  const eleRect = dom.getBoundingClientRect()
  return !(
    eleRect.top > bottom ||
    eleRect.bottom < top ||
    eleRect.right < left ||
    eleRect.left > right
  )
}

export default {
  name: "BoxSelect",
  /**
   * @member props
   * @property  {String} [node] 要框选的元素,可以是元素名,也可以是class名, 也可以是id名
   * @property  {String} [selectedClass] 已选中元素附加的class名
   */
  props: {
    node: {
      required: true,
      type: String
    },
    selectedClass: {
      type: String,
      default: 'box-select__hypocritical'
    }
  },
  // 鼠标按下
  emits: ["mouseUp", "mouseDown"],
  setup(props, { emit }) {
    let top = 0,
      left = 0,
      width = 0,
      height = 0,
      startX = 0,
      startY = 0,
      timer = null,
      // 记录是框选还是点击
      mouseOn = false

    const style = ref({}),
      selectContainer = ref(null),
      // 给当前框容器加一个唯一识别符, 以保证所选择到的元素都是当前容器的. 否则会选择到容器外同名的元素
      uuid = shallowRef("uuid_" + new Date().valueOf())

    const query = (className = '') => {
      let domName = `.${uuid.value} ${props.node}`
      className && (domName += `.${className}`)
      return Array.from(document.querySelectorAll(domName) || [])
    }

    const classOperation = (ele, method = 'add', className = '') => ele.classList[method](className)

    const setStyle = (styles = {}, newStyles = {}) => {
      Object.keys(styles).map((item) => {
        newStyles[item] = styles[item] + (isNumber(styles[item]) ? "px" : '')
      })
      style.value = newStyles
    }

    const getAreaWithinElements = () => {
      const {
        bottom,
        left,
        right,
        top
      } = selectContainer.value.getBoundingClientRect()

      // 所有可框选元素
      const elements = query()
      // 已选中元素
      const selectedElements = elements.filter(item => classOperation(item, 'contains', props.selectedClass))
      // 未选中元素
      const unselectedElements = elements.filter(item => !classOperation(item, 'contains', props.selectedClass))

      selectedElements.map(item => {
        const withinRange = isWithinRange(item, top, bottom, left, right)
        withinRange &&
          classOperation(item, 'contains', props.selectedClass) &&
          classOperation(item, 'remove', props.selectedClass)
      })

      unselectedElements.map((item) =>
        isWithinRange(item, top, bottom, left, right) &&
        classOperation(item, 'add', props.selectedClass))

      return query(props.selectedClass)
    }

    const mouseDown = debounce((event) => {
      timer = setTimeout(() => {
        mouseOn = true
        startX = event.clientX
        startY = event.clientY
        emit("mouseDown")
      }, 300)
      // 重置本次框选的元素列表
      setStyle({ left, startX, top: startY, width: 0, height: 0, display: "block" })
    })

    const mouseMove = debounce((event) => {
      if (!mouseOn) return false
      const _width = event.clientX - startX
      const _height = event.clientY - startY

      top = _height > 0 ? startY : event.clientY
      left = _width > 0 ? startX : event.clientX
      width = Math.abs(_width)
      height = Math.abs(_height)
      setStyle({ left, top, width, height })
    })

    const mouseUp = debounce((event) => {
      timer && clearTimeout(timer)
      // 判断是否鼠标左键
      if (event.which !== 1) return false
      // 判断是框选还是点击
      if (!mouseOn) return false
      mouseOn = false
      setStyle({ display: "none" })
      // 获得已选中的元素
      const selectedEles = getAreaWithinElements()
      // 响应事件,并传递本次框选的元素列表
      emit("mouseUp", selectedEles)
    })

    nextTick(() => document.addEventListener("mouseup", mouseUp))
    onUnmounted(() => document.removeEventListener("mouseup", mouseUp))

    return {
      mouseUp,
      mouseDown,
      mouseMove,
      timer,
      style,
      selectContainer,
      uuid
    }
  }
}
</script>

<style lang="scss">
.box-select__container {
  .box-select__coordinate {
    position: fixed;
    z-index: 11;
    left: 0;
    top: 0;
    width: 0;
    height: 0;
    background: rgba(0, 0, 0, .5);
    border: 1px solid rgb(255, 0, 0, 0.8);
    opacity: 0.6;
    pointer-events: none;
  }

  .box-select__hypocritical {
    background-color: blue;
  }
}
</style>