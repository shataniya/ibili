const httpio = require("./httpio")
const assist = require("./assist")
function onedurl(opt,ul,videourl){
    return new Promise((resolve,reject)=>{
        httpio.get({
            url:ul,
            headers:{
                "Referer":videourl,
                "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15"
            }
        }).then(res=>{
            // console.log(res.headers)
            if(res.headers["content-type"] === "video/x-flv"){
                resolve(assist.progress.progressWithCookie(res,opt))
            }else{
                resolve(assist.progress.progressWithoutCookie(res,opt))
            }
        })
    })
}

function moredurl(){}

module.exports.download = {
    onedurl,
    moredurl
}