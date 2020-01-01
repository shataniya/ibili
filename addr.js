// const httpio = require("./httpio")
const $ = require("websect")
const deal = require("./deal")
const path = require("path")
// const fs = require("fs")
function deallink(opt,options,addr,videourl){
    // opt.cid = addr.match(/cid=(.+?)&/)[1].trim()
    return new Promise((resolve,reject)=>{
        $.get({
            url:addr,
            headers:options
        }).then(res=>{
            var data = JSON.parse(res.text)
            if(data.code === -404 && data.message !== "success"){
                if(opt.type && opt.type !== "default"){
                    throw new Error(`${opt.url} can't be divided into ${opt.type} mode`)
                }else{
                    throw new Error("You should enter the sessdata！")
                }
            }
            var durl = null
            if(opt.type === "silent"){
                var dash = data.result.dash
                var videos = dash.video
                // baseUrl
                var level = opt.level || 80 // 在获取无声视频的时候，默认的清晰度是 1080p+
                videos = videos.filter(el=>{
                    return el.id === level
                })
                durl = videos.map(el=>{
                    url = el.baseUrl
                    return {url}
                })
                // console.log(durl)
                if(durl.length > 1 && !opt.download_backup){
                    // 不用下载地址，默认是不需要使用备用地址
                    durl = [durl[0]]
                }
            }
            if(opt.type === "audio"){
                var dash = data.result.dash
                var audios = dash.audio
                durl = audios.map(el=>{
                    url = el.baseUrl
                    return {url}
                })
                if(durl.length > 1 && !opt.download_backup){
                    // 不用下载地址，默认是不需要使用备用地址
                    durl = [durl[0]]
                }
            }
            if(!opt.type || opt.type === "default"){
                durl = data.data.durl
            }
            // console.log(durl.length)
            if(durl.length > 1){
                var len = durl.length
                function __onedurl(index){
                    if(index >= len){
                        resolve("finish")
                        return
                    }
                    var ul = durl[index].url
                    // console.log(ul)
                    opt.default_name = ul.match(/\/([^\/]+?)\?/)[1].trim()
                    var filename = opt.filename
                    var ext = path.parse(opt.default_name).ext
                    if(ext === ".m4s" && opt.type === "silent"){
                        ext = ".mp4"
                        opt.default_name = path.parse(opt.default_name).name + ext
                    }
                    if(ext === ".m4s" && opt.type === "audio"){
                        ext = ".mp3"
                        opt.default_name = path.parse(opt.default_name).name + ext
                    }
                    opt.name = filename && (filename + ext) || opt.default_name
                    deal.download.onedurl(opt,ul,videourl).then(()=>{
                        __onedurl(index+1)
                    })
                }
                __onedurl(0)
            }else{
                // durl.length === 1
                var ul = durl[0].url
                // opt.default_name = ul.match(/\/([^\/]+?)\?/)[1].trim()
                opt.default_name = ul.match(/\/([^\/]+?)\?/)[1].trim()
                var filename = opt.filename
                var ext = path.parse(opt.default_name).ext
                if(ext === ".m4s" && opt.type === "silent"){
                    ext = ".mp4"
                    opt.default_name = path.parse(opt.default_name).name + ext
                }
                if(ext === ".m4s" && opt.type === "audio"){
                    ext = ".mp3"
                    opt.default_name = path.parse(opt.default_name).name + ext
                }
                opt.name = filename && (filename + ext) || opt.default_name
                // opt.filename = name
                // opt.WriteStream = fs.createWriteStream(name)
                resolve(deal.download.onedurl(opt,ul,videourl))
            }
        })
    })
}


module.exports = {
    deallink
}