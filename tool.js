const fs = require("fs")
const path = require("path")

/* 
* @function createfolder
* @param ul {string}
* @discription 要创建的文件夹的路径，这里的路径是相对于根目录的路径
*/
function createfolder(ul){
    if(!ul){
        throw new Error("the param is not input!")
    }
    var folders = ul.split("/")
    folders = folders.filter(el=>el)
    var root = process.cwd()
    for(let i=0,len=folders.length;i<len;i++){
        root = path.join(root,folders[i])
        try{
            fs.statSync(root)
        }catch(err){
            fs.mkdirSync(root)
        }
    }
}

/* 
* @function formateVideoComments
* @discription 格式化评论信息，获取评论的主要信息
* @param data {object} 评论的数据
* @return object
*/
function formateVideoComments(data){
    var obj = {}
    obj.mid = data.member.mid
    obj.uname = data.member.uname // 用户名
    obj.sex = data.member.sex // 性别
    obj.avatar = data.member.avatar // 头像
    obj.message = data.content.message // 评论内容
    obj.ctime = data.ctime // 发布时间
    obj.like = data.like // 点赞数
    var replies = data.replies // 获取评论的回复
    if(!replies){
        return obj
    }
    obj.replies = replies.map(el=>formateVideoComments(el))
    return obj
}

/* 
* @function formateVideoCommentsMajoy
* @discription 不考虑 replies，只获取主要评论信息
* @param data {object} 评论的数据
* @return object
*/
function formateVideoCommentsMajoy(data){
    var obj = {}
    obj.mid = data.member.mid
    obj.uname = data.member.uname // 用户名
    obj.sex = data.member.sex // 性别
    obj.avatar = data.member.avatar // 头像
    obj.message = data.content.message // 评论内容
    obj.ctime = data.ctime // 发布时间
    obj.like = data.like // 点赞数
    return obj
}

/* 
* 
*/
function formateCommentsMajoy(data){
    if(!data){
        return []
    }
    if(!Array.isArray(data)){
        throw new Error("the param is not array!")
    }
    var arrs = []
    data.map(el=>{
        arrs.push(formateVideoCommentsMajoy(el))
        if(el.replies){
            
            arrs = arrs.concat(formateCommentsMajoy(el.replies))
        }
    })
    return arrs
}

module.exports = {
    createfolder,
    formateVideoComments,
    formateVideoCommentsMajoy,
    formateCommentsMajoy
}