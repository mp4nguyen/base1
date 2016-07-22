/**
 * Created by phuongnguyen on 1/01/16.
 */
var Q = require("q");
var fs = require('fs');
var path = require('path');
var CONTAINERS_URL = '/Containers/';
var uuid = require('node-uuid');

module.exports = function(model,container,file,fileId){

    var deferred = Q.defer();
    var fileName = uuid.v1();
    //If have new avatar => upload new photo into the server and then create new record in Files model and update the Person Model the avatar_id
    var old_path = file.path,
        file_size = file.size,
        file_ext = file.name.split('.').pop(),
        index = old_path.lastIndexOf('/') + 1,
        file_name = old_path.substr(index),
        new_path = path.join(process.env.PWD, '../../OBS/fileStorage/doctorAvatar/', fileName+ '.' + file_ext);

    console.log('old_path=',old_path,'file_name=',file_name,'new_path=',new_path);
    fs.readFile(old_path, function(err, data) {
        fs.writeFile(new_path, data, function(err) {
            fs.unlink(old_path, function(err) {
                if (err) {
                    console.log('upload file Err = ',err);
                    deferred.reject('Cannot save file err=' + err);
                } else {
                    console.log('upload successfully !');
                    if(isNaN(fileId) || Number(fileId)==0){
                      //check fileId is available or not
                      model.app.models.Files.create({
                                        fileId: 0,
                                        fileName: (fileName + '.' + file_ext),
                                        fileType: file_ext,
                                        fileContainer: container,
                                        fileUrl: CONTAINERS_URL+container+'/download/'+(fileName + '.' + file_ext)
                                    },function (err,obj) {
                                        if (err !== null) {
                                            deferred.reject('Cannot insert file metadata err=' + err);
                                        } else {
                                            deferred.resolve(obj);
                                        }
                                    });
                    }else{
                      model.app.models.Files.find({where:{fileId: Number(fileId)}},function(err,data){
                        console.log('find File',err,data);
                        removefile = path.join(process.env.PWD, '../../OBS/fileStorage/doctorAvatar/', data[0].fileName);
                        fs.exists(removefile, function(exists) {
                          if(exists) {
                            //Show in green
                            console.log('File exists. Deleting now ...',removefile);
                            fs.unlink(removefile);
                          } else {
                            //Show in red
                            console.log('File not found, so not deleting.');
                          }
                        });
                        data[0].fileName = (fileName + '.' + file_ext);
                        data[0].fileType = file_ext;
                        data[0].fileContainer = container;
                        data[0].fileUrl = CONTAINERS_URL+container+'/download/'+(fileName + '.' + file_ext);
                        data[0].save();
                        //deferred.resolve(obj);
                      });

                      deferred.resolve({});
                    }
                }
            });
        });
    });

    return deferred.promise;

}
