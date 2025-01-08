
// 设置文档结构
ZQL_multivideo.setVideoEl();
// 设置事件监听
// document.querySelector("#icon-oneviveo").addEventListener('click', () => {
//   playingSource.videoNum = 1;
//   setVideoEl();
// })
// document.querySelector("#icon-fourviveo").addEventListener('click', () => {
//   playingSource.videoNum = 4;
//   ZQL_multivideo.setVideoEl();
// })

ZQL_apis.gettoken().then(res => {
  if(res.error_code == 0){
    ZQLGLOBAL.token = res.data;
    init();
  }
})

// 1. 获取设备列表，摄像头列表，组成树形结构
function init() {
  Promise.all([ZQL_apis.getDevices(), ZQL_apis.getSources()]).then(res => {
    let devices = res[0].data;
    for (let deviceId in res[1].data) {
      for (let sourceId in res[1].data[deviceId]) {
        res[1].data[deviceId][sourceId].sourceId = sourceId
        res[1].data[deviceId][sourceId].deviceId = deviceId
      }
    }
    for (let i = 0; i < devices.length; i++) {
      devices[i].deviceId = devices[i].id;
      devices[i].title = devices[i].name;
      devices[i].type = 'device';
      if (res[1].data[devices[i].id]) {
        devices[i].children = Object.values(res[1].data[devices[i].id]).map(item => {
          item.id = devices[i].deviceId + '_' + item.sourceId;
          item.title = item.desc;
          item.type = 'source';
          item.checked = false;
          ZQL_sources[devices[i].deviceId + '_' + item.sourceId] = item
          return item
        })
      } else {
        // 没有摄像头的设备不显示
        devices.splice(i, 1)
        i = i - 1
      }
    }
    layui.use(function () {
      var tree = layui.tree;
      var layer = layui.layer;
      tree.render({
        elem: '#ZQL_source_tree',
        data: devices,
        // showCheckbox:true,
        onlyIconControl: true,  // 是否仅允许节点左侧图标控制展开收缩
        click: function (obj) {
          if (obj.data.sourceId) {
            let key = obj.data.deviceId + '_' + obj.data.sourceId;
            if (ZQL_sources[key].checked == false) {
              ZQL_sources[key].checked = true
              if (ZQL_playingSource.videoNum == 1) {
                ZQL_playingSource[0] = key;
                ZQL_multivideo.subscribeLive(key, 0);
                ZQL_multivideo.setAlgList(0);
              } else {
                for (let i = 0; i < 4; i++) {
                  if (!ZQL_playingSource[i]) {
                    ZQL_playingSource[i] = key;
                    ZQL_multivideo.subscribeLive(key, i);
                    ZQL_multivideo.setAlgList(i)
                    break;
                  }
                }
              }
            } else {
              ZQL_sources[key].checked = false
              if (ZQL_playingSource.videoNum == 1) {
                ZQL_playingSource[0] = null;
                ZQL_multivideo.destoryVideoByIndex(0);
                ZQL_multivideo.clearAlgList(0);
                ZQL_multivideo.liveStopLoading(0);
              } else {
                for (let i = 0; i < 4; i++) {
                  if (ZQL_playingSource[i] == key) {
                    ZQL_playingSource[i] = null;
                    ZQL_multivideo.destoryVideoByIndex(i);
                    ZQL_multivideo.clearAlgList(i)
                    ZQL_multivideo.liveStopLoading(i);
                  }
                }
              }
            }
          }
        }
      });
    });
  }).catch(err => {
    console.log(err)
  })
  // 获取系统参数，检测srs、连接mqtt
  ZQL_apis.sysArgs().then(res => {
    if (res.error_code == 0) {
      let map = res.data.map;
      ZQLGLOBAL = Object.assign(ZQLGLOBAL, map)
    }
    ZQL_multivideo.detectSrs();
    ZQL_multivideo.connectMqtt()
  }).catch(err => { })
}



//遗留
// 1.刷新
// 2.保存已选择的摄像头，
// 3.切换一分屏四分屏
