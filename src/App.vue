<template>
  <div class="label-type-container" v-if="currComponent == null">
    <div class="label-type" @click="currComponent = VideoLabel">视频标注</div>
    <div class="label-type" @click="currComponent = ImageLabel">图片标注</div>
  </div>
  <component :is="currComponent" />
</template>

<script setup>
import { ref } from 'vue';
import VideoLabel from '@/components/VideoLabel.vue';
import ImageLabel from '@/components/ImageLabel.vue';


const currComponent = ref(null);


</script>

<style lang="scss" scoped>
.label-type-container {
  height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: beige;
}

.label-type {
  flex: 1;
  font-size: 50px;
  font-weight: bolder;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  transition: background-color 0.5s ease-in-out;
  color: #444;

  &:hover {
    cursor: pointer;
    text-shadow: 1px -1px #fff, -1px 1px #999, -10px 10px 10px #8080808f;
  }

  &:nth-child(1) {
    background-color: #bdbdbd;

    &:hover {
      background-color: #e1e1e1;
      color: #222;
    }
  }

  &:nth-child(2) {
    background-color: #b1b1b1;

    &:hover {
      background-color: beige;
      color: #222;
    }
  }
}
</style>