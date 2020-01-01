const http = require("http")
const https = require("https")
const url = require("url")
// const fs = require("fs")

// 创建一个 httpio，返回只是一个 response对象
function httpio(opt){
    // return new 
}

httpio.get = function(opt){
    var options = {}
    var ul = null
    var protocol = null
    if(typeof opt === "object"){
        options.headers = opt.headers
        ul = opt.url
        options.path = url.parse(ul).path
        options.host = url.parse(ul).host
    }
    if(typeof opt === "string"){
        ul = opt
    }
    protocol = url.parse(ul).protocol
    return new Promise((resolve,reject)=>{
        if(protocol === "http:"){
            http.get(ul,options,(res)=>{
                resolve(_redirect(res,opt))
            })
        }
        if(protocol === "https:"){
            https.get(ul,options,(res)=>{
                resolve(_redirect(res,opt))
            })
        }
    })

    // 解决重定向的问题
    function _redirect(res,opt){
        var reurl = res.headers.location
        if(reurl){
            opt.url = reurl
            return new Promise((resolve,reject)=>{
                httpio.get(opt).then(res=>{
                    resolve(_redirect(res,opt))
                })
            })
        }
        return res
    }
}

module.exports = httpio