import { createApp } from 'vue'
import App from './App.vue'
import './index.scss'
import './styles/_vendors.scss'
import BalmUI from 'balm-ui';
import BalmUIPlus from 'balm-ui/dist/balm-ui-plus';
import 'balm-ui-css';
import ColorPicker from "vue3-colorpicker";
import "vue3-colorpicker/style.css";
import { I18N } from 'xgplayer'
import ZH from 'xgplayer/es/lang/zh-cn'
I18N.use(ZH)

const app = createApp(App)

app.use(BalmUI)
app.use(BalmUIPlus)
app.use(ColorPicker)

app.mount('#app')
