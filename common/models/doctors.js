var formidable = require("formidable");
var CONTAINERS_URL = '/api/Containers/';
var saveFile = require('../lib/saveFile');
var loopback = require('loopback');

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
        //update doctor
        if(files.avatar){
          //save doctor with its avatar
          saveFile(CDoctors,'doctorAvatar',files.avatar,fields.avatarId).then(function(data){
            console.log('saveFile successfully ',data);
            fields.avatarId = data.fileId;
            updateDoctor(fields,cb);
          },function(err){
            console.log('fail to save file',err);
          });
        }else {
          //save without avatar
          updateDoctor(fields,cb);
        }
      }else{
        //new doctor
        if(files.avatar){
          //save doctor with its avatar
          saveFile(CDoctors,'doctorAvatar',files.avatar,fields.avatarId).then(function(data){
            console.log('saveFile successfully ',data);
            fields.avatarId = data.fileId;
            createDoctor(fields,cb);
          },function(err){
            console.log('fail to save file',err);
          });
        }else {
          //save without avatar
          createDoctor(fields,cb);
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

  var updateDoctor = function(fields,cb){
    CDoctors.app.models.People.update({personId:fields.personId},fields,function(err,data){
      console.log('Updated pserson',err,data);
      if(err){
        cb(err,null)
      }
      cb(null,{msg:'updated successfully'});
    });
    CDoctors.update({doctorId:fields.doctorId},{isenable:fields.doctorIsenable,timeInterval:fields.doctorTimeInterval},function(err,data){
      console.log('updated doctor',err,data);
    });
  }

  var createDoctor = function(fields,cb){
    var personObject = {
          "personId": 0,
          "isenable": 1,
          "title": fields.title,
          "firstName": fields.firstName,
          "lastName": fields.lastName,
          "dob": fields.dob,
          "gender": fields.gender,
          "phone": fields.phone,
          "mobile": fields.mobile,
          "email": fields.email,
          "occupation": "",
          "address": fields.address,
          "suburbDistrict": fields.suburbDistrict,
          "ward": fields.ward,
          "postcode": "",
          "stateProvince": fields.stateProvince,
          "country": fields.country,
          "ispatient": 0,
          "isdoctor": 1,
          "avatarId": fields.avatarId ||0,
          "signatureId": 0,
          "sourceId": 0
    };


    CDoctors.app.models.People.create(personObject,function(err,data){
      console.log('Created pserson',err,data);
      if(err){

      }
      var doctorObject = {
           "doctorId": 0,
           "companyId": fields.companyId,
           "userId": 0,
           "personId": data.personId,
           "timeInterval": fields.doctorTimeInterval,
           "isenable": fields.doctorIsenable
      };
      CDoctors.create(doctorObject,function(err,data){
          console.log('created doctor',err,data);
          if(err){
            cb(err,null);
          }
          cb(null,{msg:'created successfully'});
      });

    });
  }

  CDoctors.addBookingType = function(criteria, cb) {
    var currentUser = loopback.getCurrentContext().active.currentUser;
    console.log('listBookingTypes criteria = ',criteria);
    console.log('listBookingTypes currentUser = ',currentUser);
    if(currentUser || true){
      let newDoctorBookingType = {
        "doctorId": criteria.doctorId,
        "bookingTypeId": criteria.bookingTypeId,
        "isenable": criteria.isenable,
      };

      CDoctors.app.models.CDoctorBookingTypes.create(newDoctorBookingType,(err,data)=>{
        cb(err,data);
      });

    }else{
      cb("Please log in",null);
    }

  }

  CDoctors.remoteMethod(
      'addBookingType',
      {
        accepts: [{arg: 'criteria', type: 'object', http: {source: 'body'}}],
        returns: {arg: 'bookingType', type: 'array'},
        http: {path: '/addBookingType', verb: 'post'}
      }
  );

};
