var formidable = require("formidable");
var CONTAINERS_URL = '/api/Containers/';
var saveFile = require('../lib/saveFile');

module.exports = function(CDoctors) {

  CDoctors.save = function(ctx, cb) {
    console.log('will save doctorObject = ',ctx.req.body);
    console.log('will save photo doctorObject = ',ctx.req.files);

    var form = new formidable.IncomingForm();
    var ctx2 = ctx;

    form.parse(ctx.req, function (err, fields, files) {
      //Store the data from the fields in your data store.
      //The data store could be a file or database or any other store based
      //on your application.
      console.log('-----------------------------');
      console.log('fields = ',fields);
      console.log('-----------------------------');
      console.log('files = ',files);
      console.log('-----------------------------');

      if(fields.personId){

        if(files.avatar){
          //save doctor with its avatar
          saveFile(CDoctors,'doctorAvatar',files.avatar,fields.avatarId).then(function(data){
            console.log('saveFile successfully ',data);
            fields.avatarId = data.fileId;
            CDoctors.app.models.People.update({personId:fields.personId},fields,function(err,data){
                    console.log('Updated pserson',err,data);
                    if(err){
                      cb(err,null)
                    }
                    cb(null,{msg:'updated successfully'});
                  });
          },function(err){
            console.log('fail to save file',err);
          });
        }else {
          //save without avatar
          CDoctors.app.models.People.update({personId:fields.personId},fields,function(err,data){
                  console.log('Updated pserson',err,data);
                  if(err){
                    cb(err,null)
                  }
                  cb(null,{msg:'updated successfully'});
                });
        }
      }
    });


    //If have new avatar => upload new photo into the server and then create new record in Files model and update the Person Model the avatar_id
/*    CDoctors.app.models.Files.upload(ctx,null,function(err,data){
      console.log('uploaded file = ',err,data);
    });
*/



/*    var doctorObject = ctx.req.body.doctor;
    if(doctorObject.doctorId){

      CDoctors.app.models.People.update({personId:doctorObject.Person.personId},doctorObject.Person,function(err,data){
              console.log('Updated pserson',err,data);
              if(err){
                cb(err,null)
              }
              cb(null,{msg:'updated successfully'});
            });


    }else{
      //Add new company object
      doctorObject.companyId = 0;
      CCompanies.create(companyObject,function(err,data){
        console.log(err,data);
        if(err){
          cb(err,null)
        }
        cb(null,data);
      });
    }*/
  }

  CDoctors.remoteMethod(
      'save',
      {
        accepts: [{arg: 'def', type: 'object', http: {source: 'context'}}],
        returns: {arg: 'doctor', type: 'object'},
        http: {path: '/save', verb: 'post'}
      }
  );

};
