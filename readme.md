# ibili
- 下载方式: npm i ibili
- 这是一个获取哔哩哔哩资源的工具库，可以下载哔哩哔哩的视频资源，也可以下载视频弹幕，下载用户评论等等之类
- `严重警告`：不可以将获取的资源用于恶意用途
- 有以下功能：

<table>
    <tr>
        <th width='500px' align='center'>函数名</th>
        <th width='500px' align='center'>功能</th>
    </tr>
    <tr>
        <td align='center'>loadbarrage</td>
        <td align='center'>下载视频弹幕</td>
    </tr>
    <tr>
        <td align='center'>downVideo</td>
        <td align='center'>下载视频</td>
    </tr>
    <tr>
        <td align='center'>loademojis</td>
        <td align='center'>下载表情包</td>
    </tr>
    <tr>
        <td align='center'>loadcomments</td>
        <td align='center'>获取视频下的评论</td>
    </tr>
    <tr>
        <td align='center'>loadsearch</td>
        <td align='center'>获取搜索结果</td>
    </tr>
</table>

# loadbarrage：下载视频弹幕

<table>
    <tr>
        <th>参数</th>
        <th>类型</th>
        <th>属性</th>
        <th width='60%'>说明</th>
        <th>返回值</th>
    </tr>
    <tr>
        <td rowspan='3' align='center' bgcolor='#fff'>opt</td>
        <td align='center'>string</td>
        <td></td>
        <td align='center'>如果opt是视频的av号，会根据av号获取相应的视频弹幕；如果是视频的播放地址（url），会根据视频的播放地址获取视频弹幕</td>
        <td align='center'>返回promise对象</td>
    </tr>
    <tr>
        <td align='center' rowspan='2'>object</td>
        <td align='center'>url</td>
        <td align='center'>视频的直播地址</td>
        <td align='center'>返回promise对象</td>
    </tr>
    <tr>
        <td align='center'>num</td>
        <td align='center'>番剧的集数，这个属性只对 <b>番剧</b> 有效</td>
        <td align='center'>返回promise对象</td>
    </tr>
</table>

- `loadbarrage` 的返回值是一个 `promise`对象，`promise` 的值就是视频弹幕数据

<b>使用案例：</b>
- 比如说要下载 [周杰伦的告白气球MV](https://www.bilibili.com/video/av15227278?from=search&seid=16573406510590472928) 的视频弹幕，可以知道播放地址就是 `https://www.bilibili.com/video/av15227278?from=search&seid=16573406510590472928`
```javascript
const ibili = require('ibili')
const fs = require('fs')
// 使用 视频播放地址获取弹幕
ibili.loadbarrage('https://www.bilibili.com/video/av15227278?from=search&seid=16573406510590472928').then(function(data){
    // 将数据存进demo.json文件中，你可以打开demo.json可以清楚的看到弹幕的数据
    fs.writeFile('demo.json',JSON.stringify(data,null,5),function(){
        console.log('ok')
    })
})
```
- 比如要下载 [香菜的告白气球](https://www.bilibili.com/video/av51560305?from=search&seid=16573406510590472928) 的视频弹幕,查看简介可以知道视频的av号为 51560305
```javascript
const ibili = require('ibili')
const fs = require('fs')
// 使用 视频的av号说去视频弹幕
ibili.loadbarrage('51560305').then(function(data){
    // 将数据存进demo.json文件中，你可以打开demo.json可以清楚的看到弹幕的数据
    fs.writeFile('demo.json',JSON.stringify(data,null,5),function(){
        console.log('ok')
    })
})
```
- 比如要下载整部番剧的弹幕，以 [刀剑神域 Alicization](https://www.bilibili.com/bangumi/media/md130412) 为例，要下载整部番剧的弹幕数据的话可以这样，首先要知道番剧的第一集的播放地址（url），然后要知道整部番剧的总集数（num）是多少
```javascript
const ibili = require('ibili')
const fs = require('fs')
ibili.loadbarrage({
    url:'https://www.bilibili.com/bangumi/play/ep250536', // 番剧的第一集的播放地址
    num:24 // 番剧的总集数
}).then(function(data){
    var merges = data.merge_barrages // 获取合并之后的弹幕
    console.log(merges.length) // 打印弹幕的总条数
    // 将数据存进demo.json文件中，你可以打开demo.json可以清楚的看到弹幕的数据
    fs.writeFile('demo.json',JSON.stringify(merges,null,5),function(){
        console.log('ok')
    })
})

// 打印结果
75301 // 可以看到整部番剧的弹幕有75301条
15443 // 下载整部番剧的弹幕用时 15秒
ok
```
- 下载整部番剧的弹幕数据用时比较长，实际上num可以是任意值，但是要满足 num <= 总集数

# downloadVideo：下载视频资源

<table>
    <tr>
        <th>参数</th>
        <th>类型</th>
        <th>返回值</th>
    </tr>
    <tr>
        <td width='270px' align='center' align='center'>opt</td>
        <td width='270px' align='center' align='center'>object</td>
        <td width='270px' align='center'>返回promise对象</td>
    </tr>
</table>

- opt 有以下属性：

<table>
    <tr>
        <th>属性</th>
        <th>类型</th>
        <th>说明</th>
    </tr>
    <tr>
        <td align='center' width='15%'>url</td>
        <td align='center' width='15%'>string,Array</td>
        <td align='center' width='60%'>视频的播放地址</td>
    </tr>
    <tr>
        <td align='center'>av</td>
        <td align='center'>string,Array</td>
        <td align='center'>视频的av号</td>
    </tr>
    <tr>
        <td align='center'>num</td>
        <td align='center'>number</td>
        <td align='center'>番剧的集数，这个属性只对 <b>番剧</b> 有效</td>
    </tr>
    <tr>
        <td align='center'>sessdata</td>
        <td align='center'>string</td>
        <td align='center'>如果登陆哔哩哔哩的话，在返回的响应中的Cookie里边会有一个SESSDATA值</td>
    </tr>
    <tr>
        <td align='center' rowspan='3'>type</td>
        <td align='center' rowspan='3'>string</td>
        <td align='center'>如果值为 default，那么会下载视频，type的默认值就是 default</td>
    </tr>
    <tr>
        <td align='center'>如果值为 silent，那么会下载无声视频</td>
    </tr>
    <tr>
        <td align='center'>如果值为 audio，那么会下载音频</td>
    </tr>
    <tr>
        <td align='center'>folder</td>
        <td align='center'>string</td>
        <td align='center'>存放视频的路径，默认值是 meida，因此默认会将下载的视频存放在 media文件夹 里边</td>
    </tr>
    <tr>
        <td align='center'>filename</td>
        <td align='center'>string</td>
        <td align='center'>自定义下载的视频的名称，如果不设置，会调用默认值</td>
    </tr>
    <tr>
        <td align='center'>oncomplete</td>
        <td align='center'>function</td>
        <td align='center'>视频下载结束之后会触发 oncomplete事件</td>
    </tr>
    <tr>
        <td align='center'>progress</td>
        <td align='center'>object</td>
        <td align='center'>设置下载进度条的参数</td>
    </tr>
</table>

- progress 对象的属性如下：

<table>
    <tr>
        <th>属性</th>
        <th>类型</th>
        <th>说明</th>
    </tr>
    <tr>
        <td align='center' width='100px'>labelname</td>
        <td align='center' width='100px'>string</td>
        <td align='center' width='500px'>设置进度条的标签，默认值是 Download progress</td>
    </tr>
    <tr>
        <td align='center'>length</td>
        <td align='center'>number</td>
        <td align='center'>设置进度条的长度，默认值是50</td>
    </tr>
</table>

- `url` 和 `av` 一般只需要一个就可以了，但是如果两个参数都有，那么优先使用 `av`
- 使用案例：
- 比如要下载 [周杰伦告白气球MV](https://www.bilibili.com/video/av15227278?from=search&seid=1147385259116260142),可以知道视频的播放地址就是`https://www.bilibili.com/video/av15227278?from=search&seid=1147385259116260142`
```javascript
const ibili = require('ibili')
ibili.downloadVideo({
    url:'https://www.bilibili.com/video/av15227278?from=search&seid=1147385259116260142'
}).then(()=>{
    console.log('视频下载完成！')
})
```
- 同样也可以使用av号下载视频资源
- 还可以下载整部番剧的视频资源,比如下载 [群居姐妹](https://www.bilibili.com/bangumi/media/md2614/?from=search&seid=7234801519883525570)整部番剧，首先要知道番剧第一集的播放地址（url），还有整部番剧的总集数（num）
```javascript
const ibili = require('ibili')
ibili.downloadVideo({
    url:'https://www.bilibili.com/bangumi/play/ep63865', // 番剧的第一集播放地址
    folder:'media/群居姐妹', // 将视频资源存放在 media文件夹下的 群居姐妹 文件夹里
    sessdata:'b6714909%2C158***3693%2C1a29f0c1', // 使用 sessdata，这样可以下载 1080p的视频
    num:12 // 番剧的总集数
}).then(()=>{
    console.log('番剧下载完成！')
})
```
# loademojis：下载表情包
<table>
    <tr>
        <th align='center'>参数</th>
        <th align='center'>类型</th>
        <th align='center'>属性</th>
        <th align='center'>说明</th>
        <th align='center'>返回值</th>
    </tr>
    <tr>
        <td align='center' width='100px'>opt</td>
        <td align='center' width='100px'>object</td>
        <td align='center' width='100px'>folder</td>
        <td align='center' width='400px'>存放表情包资源的路径，默认值是 media/picture</td>
        <td align='center' width='200px'>返回promise对象</td>
    </tr>
</table>

```javascript
const ibili = require('ibili')
ibili.loademojis({}).then(()=>{
    console.log('表情包下载完成！')
})
```

# loadcomments: 获取视频下的评论

<table>
    <tr>
        <th>参数</th>
        <th>类型</th>
        <th>值</th>
        <th>说明</th>
    </tr>
    <tr>
        <td rowspan='2' align='center' width='150px'>opt</td>
        <td align='center' width='150px'>string</td>
        <td width='150px'></td>
        <td align='center' width='500px'>视频的播放地址（url）或者 视频的av号</td>
    </tr>
    <tr>
        <td align='center'>object</td>
        <td></td>
        <td align='center'>如果opt是object，可以看第二个表格</td>
    </tr>
    <tr>
        <td align='center'>page</td>
        <td align='center'>number</td>
        <td></td>
        <td align='center'>页数</td>
    </tr>
    <tr>
        <td align='center' rowspan='4'>mode</td>
        <td align='center'>string</td>
        <td align='center'>default</td>
        <td align='center'>获取格式化之后的评论信息，默认值是default</td>
    </tr>
    <tr>
        <td align='center'>string</td>
        <td align='center'>reply</td>
        <td align='center'>获取无嵌套关系的评论与回复</td>
    </tr>
    <tr>
        <td align='center'>string</td>
        <td align='center'>no_reply</td>
        <td align='center'>只获取评论，没有回复</td>
    </tr>
    <tr>
        <td align='center'>string</td>
        <td align='center'>init</td>
        <td align='center'>获取评论的原始数据</td>
    </tr>
</table>

- 如果 opt是object，那么可以忽略第二个参数page，和第三个参数mode，opt的属性如图：

<table>
    <tr>
        <th>参数</th>
        <th>属性</th>
        <th>类型</th>
        <th>值</th>
        <th>说明</th>
    </tr>
    <tr>
        <td align='center' rowspan='7' width='100px'>opt</td>
        <td align='center' width='100px'>url</td>
        <td align='center' width='100px'>string</td>
        <td width='100px'></td>
        <td align='center' width='500px'>视频的播放地址（url）</td>
    </tr>
    <tr>
        <td align='center'>av</td>
        <td align='center'>string</td>
        <td></td>
        <td align='center'>视频的av号</td>
    </tr>
    <tr>
        <td align='center'>page</td>
        <td align='center'>number</td>
        <td></td>
        <td align='center'>页数</td>
    </tr>
    <tr>
        <td align='center' rowspan='4'>mode</td>
        <td align='center'>string</td>
        <td align='center'>default</td>
        <td align='center'>获取格式化之后的评论信息，默认值是default</td>
    </tr>
    <tr>
        <td align='center'>string</td>
        <td align='center'>reply</td>
        <td align='center'>获取无嵌套关系的评论与回复</td>
    </tr>
    <tr>
        <td align='center'>string</td>
        <td align='center'>no_reply</td>
        <td align='center'>只获取评论，没有回复</td>
    </tr>
    <tr>
        <td align='center'>string</td>
        <td align='center'>init</td>
        <td align='center'>获取评论的原始数据</td>
    </tr>
</table>

<b>使用案例：</b>
- 比如要获取 [周杰伦告白气球MV](https://www.bilibili.com/video/av15227278?from=search&seid=11837609076354078745) 的评论
```javascript
const ibili = require('ibili')
const fs = require('fs')
ibili.loadcomments({
    url:'https://www.bilibili.com/video/av15227278?from=search&seid=11837609076354078745' // 视频的播放地址（url）
}).then(data=>{
    // 将评论数据存储在demo.json文件里边
    fs.writeFile('demo.json',JSON.stringify(data,null,5),function(){
        console.log('ok')
    })
})
```
# loadsearch: 获取搜索结果

<table>
    <tr>
        <th>参数</th>
        <th>类型</th>
        <th>说明</th>
    </tr>
    <tr>
        <td align='center' rowspan='2' width='100px'>opt</td>
        <td align='center' width='100px'>string</td>
        <td align='center' width='500px'>搜索内容</td>
    </tr>
    <tr>
        <td align='center'>object</td>
        <td align='center'>如果opt是object，请看第二个表格</td>
    </tr>
    <tr>
        <td align='center'>page</td>
        <td align='center'>number</td>
        <td align='center'>页数</td>
    </tr>
</table>

- 如果opt是object

<table>
    <tr>
        <th>参数</th>
        <th>属性</th>
        <th>类型</th>
        <th>值</th>
        <th>说明</th>
    </tr>
    <tr>
        <td rowspan='5' align='center' width='100px'>opt</td>
        <td align='center' width='100px'>content</td>
        <td align='center' width='100px'>string</td>
        <td width='100px'></td>
        <td align='center' width='500px'>搜索内容</td>
    </tr>
    <tr>
        <td align='center'>search</td>
        <td align='center'>string</td>
        <td></td>
        <td align='center'>搜索内容</td>
    </tr>
    <tr>
        <td align='center'>page</td>
        <td align='center'>number</td>
        <td></td>
        <td align='center'>页数</td>
    </tr>
    <tr>
        <td align='center' rowspan='2'>mode</td>
        <td align='center'>string</td>
        <td align='center'>default</td>
        <td align='center'>获取格式化之后的搜索结果，默认值是 default</td>
    </tr>
    <tr>
        <td align='center'>string</td>
        <td align='center'>init</td>
        <td align='center'>获取原始的搜索结果</td>
    </tr>
</table>

<b>使用案例：</b>
```javascript
const ibili = require('ibili')
const fs = require('fs')
ibili.loadsearch({
    content:'告白气球' // 搜索内容
}).then(data=>{
    // 将搜索结果数据存进 demo.json文件里边
    fs.writeFile('demo.json',JSON.stringify(data,null,5),function(){
        console.log('ok')
    })
})
```




