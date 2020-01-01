const fs = require("fs")
const path = require("path")

const ProgressBar = require("./ progress-bar")
const { createfolder } = require('./tool')

function progressWithCookie(res,opt){
    return new Promise((resolve,reject)=>{
        // console.log(res.headers)
        var labelname = "Download progress"
        var progress_length = 50
        if(opt.progress){
            if(opt.progress.labelname){
                labelname = opt.progress.labelname
            }
            if(opt.progress.length){
                progress_length = opt.progress.length
            }
        }
        var pb = new ProgressBar(labelname,progress_length)
        // var filename = opt.filename
        var headers = res.headers
        var total = headers["content-length"]
        // var type = headers["content-type"]
        // var ext = "."+type.replace(/video\/x-/g,"")
        // var content_desc = headers["content-disposition"]
        // // console.log(content_desc)
        // var default_name = content_desc && content_desc.match(/filename=(.+?);/)[1].replace(/["''"]/g,"")
        // var default_name = opt.default_name
        // var name = filename && (filename+ext) || default_name
        // console.log(name)
        var folder = opt.folder || "media" // 默认将文件存放在 media文件夹里
        var dir = path.join(process.cwd(),folder)
        createfolder(folder)
        var fpath = path.join(dir,opt.name)
        if(!opt.type || opt.name === "default"){
            console.log("The video named \033[33m"+opt.name+"\033[39m is stored in \033[33m"+dir+"\033[39m")
        }
        if(opt.type === "silent"){
            console.log("The silent video named \033[33m"+opt.name+"\033[39m is stored in \033[33m"+dir+"\033[39m")
        }
        if(opt.type === "audio"){
            console.log("The audio named \033[33m"+opt.name+"\033[39m is stored in \033[33m"+dir+"\033[39m")
        }
        res.pipe(fs.createWriteStream(fpath))
        var complated = 0
        res.on("data",(chunk)=>{
            complated += chunk.length
            pb.render({ completed: complated, total: total })
        })
        function default_cb(){
            console.log("\nDownload complete!\n")
        }
        var cb = opt.oncomplete || default_cb
        res.on("end",function(){
            cb()
            resolve(res)
        })
        res.on("error",(err)=>{
            throw err
        })
    })
}

function progressWithoutCookie(res,opt){
    return new Promise((resolve,reject)=>{
        var pb = new ProgressBar("Download progress",50)
        var headers = res.headers
        // var filename = opt.filename
        var total = headers["content-length"]
        // var default_name = opt.default_name
        // var ext = path.parse(default_name).ext
        // var name = filename && (filename+ext) || default_name
        // console.log(name)
        var folder = opt.folder || "media" // 默认将文件存放在 media文件夹里
        var dir = path.join(process.cwd(),folder)
        createfolder(folder)
        var fpath = path.join(process.cwd(),folder,opt.name)
        if(!opt.type || opt.name === "default"){
            console.log("The video named \033[33m"+opt.name+"\033[39m is stored in \033[33m"+dir+"\033[39m")
        }
        if(opt.type === "silent"){
            console.log("The silent video named \033[33m"+opt.name+"\033[39m is stored in \033[33m"+dir+"\033[39m")
        }
        if(opt.type === "audio"){
            console.log("The audio named \033[33m"+opt.name+"\033[39m is stored in \033[33m"+dir+"\033[39m")
        }
        res.pipe(fs.createWriteStream(fpath))
        var complated = 0
        res.on("data",(chunk)=>{
            complated += chunk.length
            pb.render({ completed: complated, total: total })
        })
        function default_cb(){
            console.log("\nDownload complete!\n")
        }
        var cb = opt.oncomplete || default_cb
        res.on("end",function(){
            cb()
            resolve(res)
        })
        res.on("error",(err)=>{
            throw err
        })
    })

}

module.exports.progress = {
    progressWithCookie,
    progressWithoutCookie
}

