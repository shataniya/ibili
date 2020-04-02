// https://api.bilibili.com/x/v1/dm/list.so?oid=122789615
// https://api.bilibili.com/x/web-interface/view?aid=
// https://api.bilibili.com/x/player/playurl?avid= &cid= &qn=80&otype=json
const $ = require("websect")
const url = require("url")
const { createfolder,formateVideoComments,formateVideoCommentsMajoy,formateCommentsMajoy } = require("./tool")
const path = require("path")
const httpio = require("./httpio")
const fs = require("fs")
const _ = require('reero')
// const request = require("request")
// const httpio = require("./httpio")
// const http = require("http")
// const https = require("https")

const ad = require("./addr")
const progressBar = require("./ progress-bar")

// 判断是不是 Object
function isObject(o){
    return Object.prototype.toString.call(o) === "[object Object]"
}

// 判断是不是 Array
function isArray(o){
    return Array.isArray(o)
}

// 判断是不是 String
function isString(o){
    return typeof o === "string"
}

// 这里创建一个闭包
const ibili = (function(){
    return {
        /* 
        * @function getdanmuByav
        * @discription 通过视频的av号来获取视频弹幕
        * @param av {string} 视频的av号
        */
        getdanmuByav:function(av){
            return new Promise((resolve,reject)=>{
                $.get("https://api.bilibili.com/x/web-interface/view?aid="+av).then(res=>{
                    var cid = JSON.parse(res.text).data.cid
                    $.get("https://api.bilibili.com/x/v1/dm/list.so?oid="+cid).then(res=>{
                        var arrs = []
                        var count = 0
                        // 使用 res.uncompress() 获取解压之后的数据
                        $(res.uncompress().toString()).find("i d").each(el=>{
                            var ps = el.p.split(",")
                            var order = count++ // 获取弹幕的序号order
                            var text = el.innerHTML // 获取弹幕内容
                            var time = +ps[0] // 获取弹幕在视频中的发射时间
                            var date = new Date(+ps[4]*1000).toUTCString() // 获取弹幕发布的时间日期
                            arrs.push({order,date,time,text})
                        })
                        resolve(arrs)
                    })
                })
            })
        },
        /* 
        * @function getVideoMessageByav
        * @discription 根据视频的av号获取视频的信息
        * @param av {string} 视频的av号
        */
        getVideoMessageByav:function(av){
            return new Promise((resolve,reject)=>{
                $.get("https://api.bilibili.com/x/web-interface/view?aid="+av).then(res=>{
                    try{
                        var data = JSON.parse(res.text)
                        resolve(data)
                    }catch(err){
                        reject(err)
                    }
                })
            })
        },
        /* 
        * @function getVideoIntroByav
        * @discription 再次对视频的信息进行一次封装
        * @param av {string} 视频的av号
        */
        getVideoIntroByav:function(av){
            return new Promise((resolve,reject)=>{
                this.getVideoMessageByav(av).then(res=>{
                    var info = {}
                    var data = res.data
                    info.aid = data.aid // 获取av号
                    info.tid = data.tid
                    info.tname = data.tname
                    info.pic = data.pic
                    info.title = data.title
                    info.desc = data.desc
                    info.url = data.redirect_url
                    info.name = data.owner.name
                    info.mid = data.owner.mid
                    info.face = data.owner.face
                    info.cid = data.cid // 获取cid
                    info.like = data.stat.like
                    info.dislike = data.stat.dislike
                    info.pages = data.pages
                    info.redirect_url = data.redirect_url
                    resolve(info)
                })
            })
        },
        /* 
        * @function getMessageByepurl
        * @discription 根据 番剧的视频播放地址(epurl) 来获取视频的av号的相关信息
        * @param epurl {string} 视频的番剧地址 【这里要注意：必须是番剧地址才行】
        */
        getMessageByepurl:function(epurl){
            return new Promise((resolve,reject)=>{
                $.get(epurl).then(res=>{
                    var message = {}
                    $(res.uncompress().toString()).find("a.av-link").each(el=>{
                        message.href = el.href
                        message.text = el.innerHTML
                        message.av = el.innerHTML.replace("AV","")
                        resolve(message)
                    })
                })
            })
        },
        /* 
        * @function getavByepurl
        * @discription 根据番剧地址获取 视频的av号
        * @param epurl {string} 视频的番剧地址
        */
        getavByepurl:function(epurl){
            return new Promise((resolve,reject)=>{
                $.get(epurl).then(res=>{
                    var htmlstr = res.uncompress().toString()
                    $(htmlstr).find("a.av-link").each(el=>{
                        var av = el.innerHTML.replace("AV","")
                        // "aid":70158079,"bvid":"BV1aE411D7fp"
                        var reg = new RegExp('"aid":(\\d+?),"bvid":"'+av+'"', 'g')
                        // console.log(reg)
                        htmlstr.replace(reg, function(match, key){
                            av = key
                        })
                        resolve(av)
                    })
                })
            })
        },
        /* 
        * @function getavByavurl
        * @discription 根据视频播放地址获取 视频的av号
        * @param avurl {string} 视频的播放地址 【注意：不是番剧的视频播放地址】
        */
        getavByavurl:function(avurl){
            var path = url.parse(avurl).pathname
            return path.replace("/video/av","")
        },
        /* 
        * @function getavByurl
        * @discription 根据视频播放地址获取 视频的av号 【实际上就是综合 getavByepurl 和 getavByavurl 两个函数】
        * @param url {string} 视频的播放地址
        */
        getavByurl:function(url){
            // var url = encodeURI(url)
            return new Promise((resolve,reject)=>{
                var av = null
                if(this.isavurl(url)){
                    av = this.getavByavurl(url)
                    resolve(av)
                }
                // 判断是不是番剧的播放地址
                if(this.isepurl(url)){
                    this.getavByepurl(url).then(data=>{
                        av = data
                        resolve(av)
                    })
                }
                // 判断是不是视频地址
                if(this.isbvidurl(url)){
                    this.get_aid_by_bvidurl(url).then(aid=>{
                        resolve(aid)
                    })
                }
            })
        },
        // 判断是不是番剧的播放地址
        isepurl:function(url){
            return /ep\d+/g.test(url)
        },
        isavurl:function(url){
            return /av\d+/g.test(url)
        },
        ismdurl:function(url){
            return /md\d+/g.test(url)
        },
        // 2020-04-02新增的代码
        isbvidurl: function(url){
            return /video\/BV/g.test(url)
        },
        get_bvid: function(url){
            if(this.isbvidurl(url)){
                return url.match(/\/([^/]+?)\?/)[1]
            }else{
                throw new Error('is not bvid url...')
            }
        },
        get_cid: function(bvid){
            return new Promise((resolve, reject)=>{
                _('https://api.bilibili.com/x/player/pagelist?bvid='+bvid+'&jsonp=jsonp').then(response=>{
                    var cid = JSON.parse(response.text).data[0].cid
                    resolve(cid)
                })
            })
        },
        get_cid_by_bvidurl: function(bvidurl){
            var bvid = this.get_bvid(bvidurl)
            return new Promise((resolve, reject)=>{
                this.get_cid(bvid).then(cid=>{
                    resolve(cid)
                })
            })
        },
        get_view_by_bvidurl: function(bvidurl){
            var bvid = this.get_bvid(bvidurl)
            return new Promise((resolve, reject)=>{
                this.get_cid(bvid).then(cid=>{
                    var cid = cid
                    _('https://api.bilibili.com/x/web-interface/view?cid='+cid+'&bvid='+bvid).then(response=>{
                        var data = JSON.parse(response.text).data
                        resolve(data)
                    })
                })
            })
        },
        get_aid_by_bvidurl: function(bvidurl){
            return new Promise((resolve, reject)=>{
                this.get_view_by_bvidurl(bvidurl).then(view=>{
                    resolve(view.aid)
                })
            })
        },
        /* 
        * @function getVideoAddressByurl
        * @discription 根据 视频播放地址 获取 视频的下载地址 
        * @param url {string} 视频的播放地址
        */
        getVideoAddressByurl:function(url){
            return new Promise((resolve,reject)=>{
                this.getVideoDownLinkByurl(url).then(addr=>{
                    if(Array.isArray(addr)){
                        var uls = []
                        var proms = []
                        for(let i=0,len=addr.length;i<len;i++){
                            var prom = $.get(addr[i]).then(res=>{
                                var data = JSON.parse(res.text)
                                var durl = data.data.durl
                                var ul = durl[0].url
                                uls.push(ul)
                            })
                            proms.push(prom)
                        }
                        Promise.all(proms).then(()=>{
                            resolve(uls)
                        })
                    }
                    if(typeof addr === "string"){
                        $.get(addr).then(res=>{
                            var data = JSON.parse(res.text)
                            var durl = data.data.durl
                            var ul = durl[0].url
                            resolve(ul)
                        })
                    }
                })
            })
        },
        /* 
        * @function getdanmuByurl
        * @discription 根据 视频播放地址 获取 视频弹幕
        * @param url {string} 视频的播放地址
        */
        getdanmuByurl:function(url){
            return new Promise((resolve,reject)=>{
                this.getavByurl(url).then(data=>{
                    var av = data
                    this.getdanmuByav(av).then(res=>{
                        resolve(res)
                    })
                })
            })
        },
        /* 
        * @function getVideoDownLinkByurl
        * @discription 根据 视频播放地址 获取 视频的下载链接信息
        * @param url {string} 视频的播放地址
        * @param level {string} 视频的清晰度，112是1080P+，80是1080P，64是720P+，32是480P，16是360P
        */
        getVideoDownLinkByurl:function(url,level){
            return new Promise((resolve,reject)=>{
                this.getavByurl(url).then(res=>{
                    var av = res
                    this.getVideoDownloadLinkByav(av,level).then(data=>{
                        resolve(data)
                    })
                })
            })
        },
        /* 
        * @function getVideoDownLinkByurl
        * @discription 根据 视频的av号 获取 视频的下载链接信息
        * @param av {string} 视频的av号
        * @param level {string} 视频的清晰度，112是1080P+，80是1080P，64是720P+，32是480P，16是360P
        */
        getVideoDownloadLinkByav:function(av,level){
            var level = level || 16
            return new Promise((resolve,reject)=>{
                this.getVideoIntroByav(av).then(info=>{
                    var pages = info.pages
                    // console.log(pages)
                    if(pages.length > 1){
                        var links = []
                        for(let i=0,len=pages.length;i<len;i++){
                            var cid = pages[i].cid
                            links.push("https://api.bilibili.com/x/player/playurl?avid="+av+" &cid="+cid+" &qn="+level+"&otype=json")
                        }
                        resolve(links)
                    }else{
                        // pages.length === 1
                        var cid = info.cid
                        resolve("https://api.bilibili.com/x/player/playurl?avid="+av+" &cid="+cid+" &qn="+level+"&otype=json")
                    }
                })
            })
        },
        /* 
        * @function downloadVideo
        * @discription 专门用于下载哔哩哔哩的视频
        * @param opt {object}
        * 
        */
        downloadVideo:async function(opt){
            if(this.ismdurl(opt.url)){
                var res = await this.get_fan_message_by_url(opt.url)
                var data = res.result.main_section.episodes
                var urls = []
                var __names = []
                data.forEach(el=>{
                    urls.push(el.share_url)
                    __names.push(el.long_title)
                })
                opt.url = urls
            }
            return new Promise((resolve,reject)=>{
                var videourl = opt.url
                var options = {}
                var level = opt.level || 16
                options["Referer"] = videourl
                options["User-Agent"] = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15"
                if(opt.sessdata){
                    options["Cookie"] = "SESSDATA="+opt.sessdata
                    level = 112
                    opt.level = opt.level || 112 // 遇见会员，获取的视频自动设置为1080p+
                }
                var av = opt.av
                if(av){
                    opt.mode = "av"
                    var type = opt.type || "default"
                    if(Array.isArray(av)){
                        var avs = av
                        var len = avs.length
                        function __dealav(index){
                            if(index >= len){
                                resolve("finish")
                                return
                            }
                            var av = avs[index]
                            if(type === "silent"){
                                // 处理无声视频
                                this.getVideoSilentLinkByav(av).then(addr=>{
                                    this.downloadVideoBylink(addr,opt,options,videourl).then(()=>{
                                        __dealav.call(this,index+1)
                                    })
                                })
                            }
                            if(type === "audio"){
                                // 处理音频
                                this.getVideoSilentLinkByav(av).then(addr=>{
                                    this.downloadVideoBylink(addr,opt,options,videourl).then(()=>{
                                        __dealav.call(this,index+1)
                                    })
                                })
                            }
                            if(type === "default"){
                                // 处理有声视频，默认处理有声视频
                                this.getVideoDownloadLinkByav(av,level).then(addr=>{
                                    this.downloadVideoBylink(addr,opt,options,videourl).then(()=>{
                                        __dealav.call(this,index+1)
                                    })
                                })
                            }
                        }
                        __dealav.call(this,0)
                    }else{
                        if(type === "silent"){
                            // 处理无声视频
                            this.getVideoSilentLinkByav(av).then(addr=>{
                                resolve(this.downloadVideoBylink(addr,opt,options,videourl))
                            })
                        }
                        if(type === "audio"){
                            // 处理音频
                            this.getVideoSilentLinkByav(av).then(addr=>{
                                resolve(this.downloadVideoBylink(addr,opt,options,videourl))
                            })
                        }
                        if(type === "default"){
                            // 处理有声视频，默认处理有声视频
                            this.getVideoDownloadLinkByav(av,level).then(addr=>{
                                resolve(this.downloadVideoBylink(addr,opt,options,videourl))
                            })
                        }
                    }
                }else{
                    if(!opt.url){
                        // 如果不存在就直接报错
                        throw new Error("opt.url is not defined!")
                    }
                    opt.mode = "url"
                    var type = opt.type || "default"
                    if(opt.num){
                        // 如果设置了这个参数，就说明打算要进行这个番剧的下载
                        // 判断视频播放地址是不是番剧的播放地址
                        var eurl = opt.url
                        // 先判断是不是番剧地址
                        if(!this.isepurl(eurl)){
                            throw new Error("老哥，"+eurl+" 不是番剧的播放地址啊！")
                        }
                        var num = opt.num
                        // var addrs = 
                        var uls = eurl.match(/\d+$/)
                        var dir = eurl.replace(uls[0],"")
                        var startid = +uls[0]
                        var addrs = []
                        for(let i=0;i<num;i++){
                            var eid = startid + i
                            addrs.push(dir+eid)
                        }
                        videourl = addrs
                    }
                    if(Array.isArray(videourl)){
                        var vls = videourl
                        var len = vls.length
                        var isbangumi = false // 默认不是番剧
                        if(!__names){
                            // 说明不是番剧
                            // console.log(vls)
                            __names = []
                            vls.forEach(el=>{
                                __names.push(el.match(/av\d+/g)[0])
                            })
                        }else{
                            // 说明是番剧
                            isbangumi = true
                        }
                        function __dealurl(index){
                            if(index >= len){
                                resolve("finish")
                                return
                            }
                            if(isbangumi){
                                // 说明是番剧
                                opt.filename = `第${index+1}集_${__names[index]}`
                            }else{
                                // 说明不是番剧
                                opt.filename = __names[index]
                            }
                            var videourl = vls[index]
                            opt.url = videourl
                            options["Referer"] = videourl
                            if(type === "silent"){
                                this.getVideoSilentLinkByurl(videourl).then(addr=>{
                                    this.downloadVideoBylink(addr,opt,options,videourl).then(()=>{
                                        __dealurl.call(this,index+1)
                                    })
                                })
                            }
                            if(type === "audio"){
                                this.getVideoSilentLinkByurl(videourl).then(addr=>{
                                    this.downloadVideoBylink(addr,opt,options,videourl).then(()=>{
                                        __dealurl.call(this,index+1)
                                    })
                                })
                            }
                            if(type === "default"){
                                this.getVideoDownLinkByurl(videourl,level).then(addr=>{
                                    this.downloadVideoBylink(addr,opt,options,videourl).then(()=>{
                                        __dealurl.call(this,index+1)
                                    })
                                })
                            }
                        }
                        __dealurl.call(this,0)
                    }else{
                        if(type === "silent"){
                            this.getVideoSilentLinkByurl(videourl).then(addr=>{
                                resolve(this.downloadVideoBylink(addr,opt,options,videourl))
                            })
                        }
                        if(type === "audio"){
                            this.getVideoSilentLinkByurl(videourl).then(addr=>{
                                resolve(this.downloadVideoBylink(addr,opt,options,videourl))
                            })
                        }
                        if(type === "default"){
                            this.getVideoDownLinkByurl(videourl,level).then(addr=>{
                                resolve(this.downloadVideoBylink(addr,opt,options,videourl))
                            })
                        }
                    }
                }
            })
        },
        /* 
        * @function downloadVideoBylink
        * @discription 根据视频下载链接 下载视频
        * 
        */
        downloadVideoBylink:function(addr,opt,options,videourl){
            return new Promise((resolve,reject)=>{
                if(Array.isArray(addr)){
                    var len = addr.length
                    function __deallink(index){
                        if(index >= len){
                            resolve("finish")
                            return
                        }
                        if(opt.mode === "av"){
                            videourl = addr[index]
                            options["Referer"] = addr[index] // 这里记得加上来源，因为 videourl此时的值是 undefined
                        }
                        ad.deallink(opt,options,addr[index],videourl).then(()=>{
                            __deallink(index+1)
                        })
                    }
                    __deallink(0)
                }
                if(typeof addr === "string"){
                    if(opt.mode === "av"){
                        // videourl=addr ，为了避免 videourl 为undefined ，这里可以给它赋值为 addr
                        videourl = addr
                        options["Referer"] = addr // 这里记得加上来源，因为 videourl此时的值是 undefined
                    }
                    resolve(ad.deallink(opt,options,addr,videourl))
                }
            })
        },
        getVideoSplitByurl:function(url){
            return new Promise((resolve,reject)=>{
                this.getavByurl(url).then(data=>{
                    var av = data
                    // this.getVideoIntroByav(av).then(info=>{
                    //     var cid = info.cid
                    //     console.log(av,cid)
                    // })
                })
            })
        },
        /* 
        * @function getVideoSplitMessageByav
        * @discription 根据 视频的av号 获取视频分裂之后是视频信息【所谓的视频分离，就是获取 m4s文件】
        * @param av {string} 视频的av号
        */
        getVideoSplitMessageByav:function(av){
            return new Promise((resolve,reject)=>{
                this.getVideoIntroByav(av).then(info=>{
                    var cid = info.cid
                    var redirect_url = info.redirect_url
                    // console.log(av,cid)
                    // https://api.bilibili.com/pgc/player/web/playurl?avid=70868294&cid=122789615&qn=0&type=&fnver=0&fnval=16&otype=json
                    var ul = "https://api.bilibili.com/pgc/player/web/playurl?avid="+av+"&cid="+cid+"&qn=0&type=&fnver=0&fnval=16&otype=json"
                    // console.log(ul)

                    // "Referer":"https://www.bilibili.com/bangumi/play/ep285938",
                    // "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15",
                    $.get({
                        url:ul,
                        headers:{
                            "Referer":redirect_url,
                            // sessdata:"26fb4367%2C1578565840%2Cd589c1c1"
                            "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15",
                        }
                    }).then(res=>{
                        var data = JSON.parse(res.text)
                        data.redirect_url = redirect_url
                        resolve(data)
                    })
                })
            })
        },
        /* 
        * @function getVideoSplitResourcesByav
        * @discription 根据 视频的av号 获取视频分裂之后是 无声视频 和 音频信息
        * @param av {string} 视频的av号
        */
        getVideoSplitResourcesByav:function(av){
            return new Promise((resolve,reject)=>{
                this.getVideoSplitMessageByav(av).then(data=>{
                    var dash = data.result.dash
                    var video = dash.video
                    var audio = dash.audio
                    var redirect_url = data.redirect_url
                    resolve({video,audio,redirect_url})
                })
            })
        },
        /* 
        * @function getVideoSplitAddrByav
        * @discription 根据 视频的av号 获取视频分裂之后是 无声视频 和 音频 的下载地址
        * @param av {string} 视频的av号
        */
        getVideoSplitAddrByav:function(av){
            return new Promise((resolve,reject)=>{
                this.getVideoSplitResourcesByav(av).then(data=>{
                    var video = data.video
                    var audio = data.audio
                    var vlinks = video.map(el=>el.baseUrl)
                    var alinks = audio.map(el=>el.baseUrl)
                    var redirect_url = data.redirect_url
                    resolve({vlinks,alinks,redirect_url})
                })
            })
        },
        getVideoSilentLinkByav:function(av){
            return new Promise((resolve,reject)=>{
                this.getVideoIntroByav(av).then(info=>{
                    var cid = info.cid
                    var redirect_url = info.redirect_url
                    var ul = "https://api.bilibili.com/pgc/player/web/playurl?avid="+av+"&cid="+cid+"&qn=0&type=&fnver=0&fnval=16&otype=json"
                    resolve(ul)
                })
            })
        },
        getVideoSilentLinkByurl:function(url){
            return new Promise((resolve,reject)=>{
                this.getavByurl(url).then(av=>{
                    this.getVideoSilentLinkByav(av).then(ul=>{
                        resolve(ul)
                    })
                })
            })
        },
        /* 
        * @function loadbarrageByone
        * @discription 根据 视频的播放地址 和 视频的av号 来获取 视频弹幕
        * @param opt {string} 视频的播放地址 或者 视频的av号
        */
        loadbarrageByone:function(opt){
            return new Promise((resolve,reject)=>{
                if(isNaN(+opt)){
                    // 说明是 url
                    this.getdanmuByurl(opt).then(dm=>{
                        resolve(dm)
                    })
                }else{
                    // 说明就是视频的 av号
                    this.getdanmuByav(opt).then(dm=>{
                        resolve(dm)
                    })
                }
            })
        },
        /* 
        * @function loadbarrageByArray
        * @discription 根据 视频播放地址或者视频av号 组成的数组 来获取视频弹幕
        * @param opt {array} 
        * @discription 实际上可以理解为 loadbarrageByArray 是对 loadbarrageByone参数为数组的封装
        */ 
        loadbarrageByArray:function(opt){
            var barrages = []
            var merge_barrages = []
            return new Promise((resolve,reject)=>{
                var opts = opt
                var len = opts.length
                function __dealbarrage(index){
                    if(index >= len){
                        resolve({barrages,merge_barrages})
                        return
                    }
                    var options = opts[index]
                    this.loadbarrageByone(options).then((data)=>{
                        barrages.push(data)
                        merge_barrages = merge_barrages.concat(data)
                        __dealbarrage.call(this,index+1)
                    })
                }
                __dealbarrage.call(this,0)
            })
        },
        /* 
        * @funciton loadbarrage
        * @discription 实际上是爬取视频弹幕的总的封装
        * @param opt {string,array,object}
        */
        loadbarrage:async function(opt){
            if(typeof opt === "string" && this.ismdurl(opt)){
                var res = await this.get_fan_message_by_url(opt)
                var data = res.result.main_section.episodes
                var urls = []
                data.forEach(el=>{
                    urls.push(el.share_url)
                })
                opt = urls
            }
            return new Promise((resolve,reject)=>{
                // 如果 opt 是数组，那么就调用 loadbarrageByArray
                if(Array.isArray(opt)){
                    resolve(this.loadbarrageByArray(opt))
                }
                // 如果 opt 是string，那么就调用 loadbarrageByone
                if(typeof opt === "string"){
                    resolve(this.loadbarrageByone(opt))
                }
                // 如果 opt 是object，那么就启动 爬取番剧的视频弹幕
                if(typeof opt === "object"){
                    var eurl = opt.url // 这里的 opt.url 实际上就是 番剧的播放地址
                    // 先判断是不是番剧地址
                    if(!this.isepurl(eurl)){
                        throw new Error("老哥，"+eurl+" 不是番剧的播放地址啊！")
                    }
                    var num = opt.num || 1 // 这里的num，实际上就是番剧的集数
                    var uls = eurl.match(/\d+$/)
                    var dir = eurl.replace(uls[0],"")
                    var startid = +uls[0]
                    var addrs = []
                    for(let i=0;i<num;i++){
                        var eid = startid + i
                        addrs.push(dir+eid)
                    }
                    resolve(this.loadbarrageByArray(addrs))
                }
            })
        },
        /* 
        * @function loadvideomessage
        * @discription 获取视频的信息
        * @param opt {string} 可以是 视频的播放地址，也可以是视频的av号
        */
        loadvideomessage:function(opt){
            return new Promise((resolve,reject)=>{
                if(typeof opt !== "string"){
                    throw new Error("the param is not string!")
                }
                if(isNaN(opt)){
                    resolve(this.loadmessageByurl(opt))
                }else{
                    resolve(this.getVideoMessageByav(opt))
                }
            })
        },
        /* 
        * @function loadmessageByurl
        * @discription 根据视频的播放地址获取视频的信息
        * @param opt {string} 可以是 视频的播放地址
        */
        loadmessageByurl:function(url){
            return new Promise((resolve,reject)=>{
                this.getavByurl(url).then(av=>{
                    this.getVideoMessageByav(av).then(data=>{
                        resolve(data)
                    })
                })
            })
        },
        /* 
        * @function loadmessage
        * @discription 这算是对获取 视频信息的一个总的封装
        * @param opt {string,array,object}
        * @return promise
        */
        loadmessage:function(opt){
            return new Promise((resolve,reject)=>{
                if(isString(opt)){
                    resolve(this.loadvideomessage(opt))
                }
                if(isArray(opt)){
                    resolve(this.loadvideomessageByArray(opt))
                }
                if(isObject(opt)){
                    if(!opt.url){
                        throw new Error("url is not defined!")
                    }
                    if(!this.isepurl(opt.url)){
                        if(opt.num){
                            throw new Error("抱歉，"+opt.url+"并不是番剧的播放地址！")
                        }else{
                            resolve(this.loadvideomessage(opt.url))
                        }
                    }else{
                        var addrs = this.getAllepurl(opt)
                        if(addrs.length > 1){
                            resolve(this.loadvideomessageByArray(addrs))
                        }else{
                            resolve(this.loadvideomessage(addrs[0]))
                        }
                    }
                }
            })
        },
        loadvideomessageByArray:function(opt){
            return new Promise((resolve,reject)=>{
                if(!Array.isArray(opt)){
                    throw new Error("the param is not array!")
                }
                var opts = opt
                var len = opts.length
                var msgs = []
                function __dealmessage(index){
                    if(index >= len){
                        resolve(msgs)
                        return
                    }
                    var opt = opts[index]
                    this.loadvideomessage(opt).then((data)=>{
                        msgs.push(data)
                        __dealmessage.call(this,index+1)
                    })
                }
                __dealmessage.call(this,0)
            })
        },
        /* 
        * @function getAllepurl
        * @discription 获取指定集数的 番剧播放地址
        * @param opt {string,array,object}
        * @return 番剧播放地址的数组
        */
        getAllepurl:function(opt){
            if(!isObject(opt)){
                throw new Error("the param is not object!")
            }
            // 判断视频播放地址是不是番剧的播放地址
            var eurl = opt.url
            // 先判断是不是番剧地址
            if(!this.isepurl(eurl)){
                throw new Error("老哥，"+eurl+" 不是番剧的播放地址啊！")
            }
            var num = opt.num || 1
            // var addrs = 
            var uls = eurl.match(/\d+$/)
            var dir = eurl.replace(uls[0],"")
            var startid = +uls[0]
            var addrs = []
            for(let i=0;i<num;i++){
                var eid = startid + i
                addrs.push(dir+eid)
            }
            return addrs
        },
        /* 
        * @function getemojismessage
        * @discription 获取哔哩哔哩表情包的信息
        * @return promise
        */
        getemojismessage:function(){
            return new Promise((resolve,reject)=>{
                $.get("https://api.bilibili.com/x/v2/reply/emojis").then(res=>{
                    var data = JSON.parse(res.text).data
                    resolve(data)
                })
            })
        },
        /* 
        * @function getemojisintro
        * @discription 是对获取的表情包的信息的封装，因为并不是所有的信息是有用的，我只是获取主要的信息
        * @return promise
        */
        getemojisintro:function(){
            return new Promise((resolve,reject)=>{
                this.getemojismessage().then(data=>{
                    var uls = data.map(el=>{
                        var pname = el.pname
                        var purl = el.purl
                        var emojis = el.emojis
                        return {pname,purl,emojis}
                    })
                    resolve(uls)
                })
            })
        },
        /* 
        * @function loademojis
        * @discription 下载哔哩哔哩的表情包
        * @param opt {object} 建议直接去看官网文档【readme.md】
        * @return promise
        */
        // 下载表情包
        loademojis:function(opt){
            return new Promise((resolve,reject)=>{
                if(!opt){
                    resolve(this.getemojisintro())
                }
                if(!isObject(opt)){
                    throw new Error("the param is not object!")
                }else{
                    var folder = opt.folder || "/media/picture" // 设置存放表情包的默认路径是 根目录下的 "/media/picture" 文件夹里
                    createfolder(folder)
                    this.getemojisintro().then(data=>{
                        var len = data.length
                        function __dealpicture(index){
                            if(index >= len){
                                resolve()
                                return
                            }
                            var dt = data[index]
                            var pathname = path.join(folder,dt.pname)
                            createfolder(pathname)
                            var emojis = dt.emojis
                            var emolen = emojis.length
                            function __dealemo(index1){
                                if(index1 >= emolen){
                                    __dealpicture.call(this,index+1)
                                    return
                                }
                                var emo = emojis[index1]
                                var eul = emo.url
                                var name = emo.name
                                this.loadpicture({
                                    url:eul,
                                    name,
                                    folder:pathname
                                }).then(()=>{
                                    __dealemo.call(this,index1+1)
                                })
                            }
                            __dealemo.call(this,0)
                        }
                        __dealpicture.call(this,0)
                    })
                }
            })
        },
        /* 
        * @function loadpicture
        * @discription 根据图片的下载地址来下载图片
        * @param opt {object} 建议直接去看官网文档【readme.md】
        * @return promise
        */
        loadpicture:function(opt){
            return new Promise((resolve,reject)=>{
                if(!isObject(opt)){
                    throw new Error("the param is not object!")
                }
                if(!opt.url){
                    throw new Error("url is not defined!")
                }
                // 判断图片的名称有没有定义
                if(!opt.name){
                    throw new Error("picture name is not defined!")
                }
                var ul = opt.url
                var folder = opt.folder || "/media/picture"
                var ext = path.parse(ul).ext
                var name = opt.name + ext
                var pathname = path.join(process.cwd(),folder,name)
                createfolder(folder)
                var pb = new progressBar("Download progress",50)
                httpio.get(ul).then(res=>{
                    var headers = res.headers
                    var total = headers["content-length"]
                    var complated = 0
                    console.log("The picture named \033[33m"+name+"\033[39m is stored in \033[33m"+path.join(process.cwd(),folder)+"\033[39m")
                    res.pipe(fs.createWriteStream(pathname))
                    res.on("data",(chunk)=>{
                        complated += chunk.length
                        pb.render({ completed: complated, total: total })
                    })
                    res.on("end",function(){
                        console.log("\nDownload complete!\n")
                        resolve(res)
                    })
                })
            })
        },
        /* 
        * @funciton loadfanlist
        * @discription 获取新番的列表
        * @return promise
        */
        // 获取新番列表
        loadfanlist:function(){
            return new Promise((resolve,reject)=>{
                $.get("https://api.bilibili.com/pgc/web/rank/list?season_type=1&day=3").then(res=>{
                    var data = JSON.parse(res.text)
                    resolve(data.result)
                })
            })
        },
        /* 
        * @funciton loadslide
        * @discription 获取幻灯片列表
        * @return promise
        */
        // 获取幻灯片列表
        loadslide:function(){
            return new Promise((resolve,reject)=>{
                $.get("https://api.bilibili.com/x/web-show/res/loc?pf=0&jsonp=jsonp&id=23").then(res=>{
                    var data = JSON.parse(res.text).data
                    resolve(data)
                })
            })
        },
        /* 
        * @funciton loadupdatelist
        * @discription 获取番剧的更新列表
        * @return promise
        */
        // 获取番剧的更新列表
        loadupdatelist:function(){
            return new Promise((resolve,reject)=>{
                $.get("https://api.bilibili.com/pgc/web/timeline?types=1").then(res=>{
                    var data = JSON.parse(res.text).result
                    resolve(data)
                })
            })
        },
        /* 
        * @function getSearchBypage
        * @discription 根据搜索内容和page参数获取搜索结果
        * @param content {string} 搜索内容
        * @param page {number} 页数
        * @return promise
        */
        getSearchBypage:function(content,page){
            var page = page || 1
            var ul = "https://api.bilibili.com/x/web-interface/search/all/v2?context=&page="+page+"&order=&keyword="+content+"&duraton=&tids_1=&tids_2=&__refresh__=true&__reload__=false&highlight=1&single_column=0&jsonp=jsonp"
            var enul = encodeURI(ul) // 为了防止地址里边有中文
            //  console.log(enul)
            return new Promise((resolve,reject)=>{
                $.get(enul).then(res=>{
                    var data = JSON.parse(res.text).data.result
                    if(!data){
                        resolve([])
                    }else{
                        var result = data.filter(el=>el.data.length)
                        resolve(result)
                    }
                })
            })
        },
        /* 
        * @function getSearchIntrobypage
        * @discription 根据 搜索内容 和 page页数 获取搜索结果的主要信息
        * @param content {string} 搜索内容
        * @param page {number} 页数
        * @return promise
        */
        getSearchIntroBypage:function(content,page){
            return new Promise((resolve,reject)=>{
                this.getSearchBypage(content,page).then(result=>{
                    if(!result){
                        resolve(result)
                    }else{
                        var arrs = result.map(el=>{
                            var obj = {}
                            obj["result_type"] = el["result_type"]
                            obj.data = el.data.map(el=>{
                                var o = {}
                                o.type = el.type // 资源类型，值一般是 video
                                o.id = el.id // 相当于视频的av号
                                o.author = el.author // 视频的发布作者
                                o.mid = el.mid
                                o.typename = el.typename // 视频的种类
                                o.arcurl = el.arcurl // 视频的播放地址
                                o.aid = el.aid // 视频的av号
                                o.title = el.title // 视频的标题
                                o.description = el.description // 视频的简介
                                o.pic = el.pic // 视频的封面
                                o.play = el.play // 视频的播放数量
                                o.video_review = el.video_review
                                o.favorites = el.favorites // 视频的收藏数量
                                o.tag = el.tag // 视频的标签
                                o.review = el.review // 视频的评论数量
                                o.pubdate = el.pubdate // 发布日期
                                o.senddate = el.senddate // 发送日期
                                o.duration = el.duration // 视频总时长
                                return o
                            })
                            return obj
                        })
                        resolve(arrs)
                    }
                })
            })
        },
        loadsearch:function(opt){
            return new Promise((resolve,reject)=>{
                if(isString(opt)){
                    var args = Array.from(arguments)
                    var content = args[0]
                    var page = args[1] || 1
                    resolve(this.getSearchIntroBypage(content,page))
                }
                if(isObject(opt)){
                    if(!(opt.search || opt.content)){
                        throw new Error("No search content！")
                    }
                    var content = opt.search || opt.content
                    var page = opt.page || 1
                    var mode = opt.mode || "default" // mode默认值是 default
                    if(mode === "default"){
                        resolve(this.getSearchIntroBypage(content,page))
                    }
                    if(mode === "init"){
                        resolve(this.getSearchBypage(content,page))
                    }
                }
            })
        },
        /* 
        * @function getVideoCommentsByav
        * @discription 根据视频的av号来 获取评论
        * @param av {string} 视频的av号
        * @return promise
        */
        getVideoCommentsByav:function(av,page){
            var ul = "https://api.bilibili.com/x/v2/reply?jsonp=jsonp&pn="+page+"&type=1&oid="+av+"&sort=2"
            // console.log(ul)
            return new Promise((resolve,reject)=>{
                $.get(ul).then(res=>{
                    var data = JSON.parse(res.text).data.replies
                    resolve(data)
                })
            })
        },
        /* 
        * @function getVideoCommentsByurl
        * @discription 根据视频的播放地址 来获取评论
        * @param url {string} 视频的播放地址
        * @return promise
        */
       getVideoCommentsByurl:function(url,page){
           return new Promise((resolve,reject)=>{
               this.getavByurl(url).then(av=>{
                   this.getVideoCommentsByav(av,page).then(data=>{
                       resolve(data)
                   })
               })
           })
       },
       /* 
       * @function getVideoCommentsIntroByav
       * @discription 根据视频的av号 获取视频的评论
       * @param av {string} 视频的av号
       * @return promise
       */
       getVideoCommentsIntroByav:function(av, page){
           return new Promise((resolve,reject)=>{
               this.getVideoCommentsByav(av, page).then(data=>{
                   var arrs = data.map(el=>formateVideoComments(el))
                   resolve(arrs)
               })
           })
       },
       getVideoCommentsIntroContainByav:function(av, page){
           return new Promise((resolve,reject)=>{
               this.getVideoCommentsByav(av, page).then(data=>{
                   resolve(formateCommentsMajoy(data))
               })
           })
       },
       getVideoCommentsIntroContainByurl:function(url, page){
           return new Promise((resolve,reject)=>{
               this.getavByurl(url).then(av=>{
                   this.getVideoCommentsIntroContainByav(av, page).then(data=>{
                       resolve(data)
                   })
               })
           })
       },
       getVideoMainCommentsByav:function(av, page){
           return new Promise((resolve,reject)=>{
                this.getVideoCommentsByav(av, page).then(data=>{
                    var result = data.map(el=>formateVideoCommentsMajoy(el))
                    resolve(result)
                })
           })
       },
       getVideoMainCommentsByurl:function(url, page){
           return new Promise((resolve,reject)=>{
               this.getavByurl(url).then(av=>{
                   this.getVideoMainCommentsByav(av, page).then(data=>{
                       resolve(data)
                   })
               })
           })
       },
       /* 
       * @function getVideoCommentsIntroByurl
       * @discription 根据视频的播放地址 获取视频的评论
       * @param url {string} 视频的播放地址
       * @return promise
       */
       getVideoCommentsIntroByurl:function(url, page){
           return new Promise((resolve,reject)=>{
               this.getavByurl(url).then(av=>{
                   this.getVideoCommentsIntroByav(av, page).then(data=>{
                       resolve(data)
                   })
               })
           })
       },
       /* 
       * @function loadcomments
       * @discription 获取视频的评论
       * @param opt {string} 视频的播放地址 或者 视频的av号
       * @return promise
       */
       loadcomments:function(opt,_page){
           return new Promise((resolve,reject)=>{
               if(isString(opt)){
                   var page = _page || 1
                   // 判断是不是视频的播放地址
                   if(isNaN(+opt)){
                        resolve(this.getVideoCommentsIntroByurl(opt,page))
                   }else{
                        resolve(this.getVideoCommentsIntroByav(opt,page))
                   }
               }
               if(isObject(opt)){
                   var mode = opt.mode || "default" // 默认是default
                   var page = opt.page || 1
                   var av = opt.av
                   if(mode === "default"){
                       // mode为default的时候，就会获取过封装之后的评论数据
                       var param = av || opt.url
                       resolve(this.loadcomments(param,page))
                   }
                   if(mode === "reply"){
                       // mode为reply的时候，就会获取过包含回复的评论数据
                       if(av){
                           resolve(this.getVideoCommentsIntroContainByav(av,page))
                       }else{
                           resolve(this.getVideoCommentsIntroContainByurl(opt.url,page))
                       }
                   }
                   if(mode === "no_reply"){
                        // mode为no_reply的时候，就会获取过滤掉回复的评论数据
                       if(av){
                           resolve(this.getVideoMainCommentsByav(av,page))
                       }else{
                           resolve(this.getVideoMainCommentsByurl(opt.url,page))
                       }
                   }
                   if(mode === "init"){
                        // mode为init的时候，就会获取最原始的评论数据    
                       if(av){
                            resolve(this.getVideoCommentsByav(av,page))
                       }else{
                            resolve(this.getVideoCommentsByurl(opt.url,page))
                       }
                   }
               }
               if(arguments.length > 2){
                    // 如果有两个参数，那么第一个参数就是视频的播放地址或者视频的av号，第二个参数就是mode参数
                    var _url = arguments[0]
                    var page = arguments[1]
                    var mode = arguments[2] || "default"
                    if(isNaN(+_url)){
                        // 说明是视频的播放地址
                        resolve(this.loadcomments({url:_url, page, mode}))
                    }else{
                        // 说明是视频的av号
                        resolve(this.loadcomments({av:_url, page, mode}))
                    }

               }
           })
       },
       /* 
       * @function getmidByurl 
       * @param url {string} 番剧的地址
       * @return media_id
       */
        get_mid_by_url:function(url){
            return url.match(/md(\d+)/)[1]
        },
        get_sid_by_mid:function(mid){
            var ul = 'https://api.bilibili.com/pgc/review/user?media_id=' + mid
            return new Promise((resolve,reject)=>{
                $.get(ul).then(res=>{
                    var data = JSON.parse(res.text)
                    resolve(data.result.media.season_id)
                })
            })
        },
        get_fan_message_by_sid:function(sid){
            var ul = 'https://api.bilibili.com/pgc/web/season/section?season_id=' + sid
            return new Promise((resolve,reject)=>{
                $.get(ul).then(res=>{
                    resolve(JSON.parse(res.text))
                })
            })
        },
        get_fan_message_by_url:function(url){
            return new Promise((resolve,reject)=>{
                this.get_sid_by_mid(this.get_mid_by_url(url)).then(sid=>{
                    this.get_fan_message_by_sid(sid).then(data=>{
                        resolve(data)
                    })
                })
            })
        },
        get_search_result:function(opt){
            return new Promise((resolve,reject)=>{
                if(isString(opt)){
                    var content = arguments[0]
                    if(!content || typeof content === "number"){
                        throw new Error('搜索内容为空')
                    }
                    var page = arguments[1] || 1
                    var ul = "https://api.bilibili.com/x/web-interface/search/all/v2?context=&page="+page+"&order=&keyword="+content+"&duraton=&tids_1=&tids_2=&__refresh__=true&__reload__=false&highlight=1&single_column=0&jsonp=jsonp"
                    $.get(ul).then(res=>{
                        resolve(JSON.parse(res.text))
                    })
                }
                if(isObject(opt)){
                    var content = opt.content || opt.search
                    if(!content || typeof content === "number"){
                        throw new Error('搜索内容为空')
                    }
                    var page = opt.page || 1
                    var ul = "https://api.bilibili.com/x/web-interface/search/all/v2?context=&page="+page+"&order=&keyword="+content+"&duraton=&tids_1=&tids_2=&__refresh__=true&__reload__=false&highlight=1&single_column=0&jsonp=jsonp"
                    $.get(ul).then(res=>{
                        resolve(JSON.parse(res.text))
                    })
                }
            })
        }
    }
})();

module.exports = ibili
