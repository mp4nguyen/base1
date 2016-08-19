var loopback = require('loopback');

module.exports = function(CCompanies) {

  CCompanies.initData = function(cb) {

      var currentUser = loopback.getCurrentContext().active.currentUser;
      var companyData = {};
      var includes = [
                {relation:'Clinics',scope:{include:[
                                                      {relation:'BookingTypes'},
                                                      {relation:'Doctors',scope:{include:'Person'}}
                                                   ]}},
                {relation:'Doctors',scope:{include:[
                                                      {relation:'Person',scope:{include:[
                                                                                          {relation:'Avatar'},
                                                                                          {relation:'Signature'}
                                                                                        ]
                                                                                }
                                                      },
                                                      {relation:'Clinics'},
                                                      {relation:'BookingTypes'}
                                                   ]}}
                ];
//{relation:'RostersV'}
      console.log('CCompanies.initData currentUser=',currentUser);
      if(currentUser && currentUser.userType.indexOf("ADMIN") >= 0){
          //check if the user is admin  ; if yes, return all bookings
          CCompanies.find({
            include: includes
          },function(err,data){
            companyData = data[0];
            cb(null,data);
          });

      }else if(currentUser && currentUser.userType.indexOf("COMPANY") >= 0){
          CCompanies.find( {
            where:{companyId:currentUser.companyId},
            include:includes
          },function(err,data){
              companyData = data[0];
              cb(null,data);
          });
      }
      else{
          cb(null,"Authorization Required");
      }
  };

  CCompanies.remoteMethod('initData', {
      returns: {arg: 'initData', type: 'array'},
      http: {path:'/initData', verb: 'get'}
  });


  CCompanies.save = function(companyObject, cb) {
    console.log('will save companyObject = ',companyObject);
    if(companyObject.companyId){
      //Update company object
      CCompanies.update({companyId:companyObject.companyId},companyObject,function(err,data){
        console.log(err,data);
        if(err){
          cb(err,null)
        }
        cb(null,{msg:'updated successfully'});
      });
    }else{
      //Add new company object
      companyObject.companyId = 0;
      CCompanies.create(companyObject,function(err,data){
        console.log(err,data);
        if(err){
          cb(err,null)
        }
        cb(null,data);
      });
    }
  }

  CCompanies.remoteMethod(
      'save',
      {
        accepts: [{arg: 'def', type: 'object', http: {source: 'body'}}],
        returns: {arg: 'company', type: 'object'},
        http: {path: '/save', verb: 'post'}
      }
  );

  CCompanies.generateRoster = function(def, cb) {
    CCompanies.app.models.CRosters.generateRoster(def,cb);
  }

  CCompanies.remoteMethod(
      'generateRoster',
      {
        accepts: [{arg: 'def', type: 'object', http: {source: 'body'}}],
        returns: {arg: 'rosters', type: 'array'},
        http: {path: '/generateRoster', verb: 'post'}
      }
  );

  CCompanies.listRosters = function(doctor, cb) {
    console.log('listRosters doctor.doctorId=',doctor);
    CCompanies.app.models.RostersV.find({where:{doctorId:doctor.doctorId}},function(err,data){
      //console.log('listRosters = ',err,data);
      cb(err,data);
    });
  }

  CCompanies.remoteMethod(
      'listRosters',
      {
        accepts: [{arg: 'doctor', type: 'object', http: {source: 'body'}}],
        returns: {arg: 'rosters', type: 'array'},
        http: {path: '/listRosters', verb: 'post'}
      }
  );

  CCompanies.listBookingTypes = function(criteria, cb) {
    var currentUser = loopback.getCurrentContext().active.currentUser;
    console.log('listBookingTypes criteria = ',criteria);
    console.log('listBookingTypes currentUser = ',currentUser);
    if(currentUser || true){
      CCompanies.app.models.CBookingTypes.find({where:{isenable:1}},(err,data) => {
        cb(err,data);
      });
    }else{
      cb("Please log in",null);
    }

  }

  CCompanies.remoteMethod(
      'listBookingTypes',
      {
        accepts: [{arg: 'criteria', type: 'object', http: {source: 'body'}}],
        returns: {arg: 'bookingTypes', type: 'array'},
        http: {path: '/listBookingTypes', verb: 'post'}
      }
  );

  CCompanies.listBookings = function(criteria, cb) {
    var currentUser = loopback.getCurrentContext().active.currentUser;
    console.log('listBookings criteria = ',criteria);
    console.log('listBookings currentUser = ',currentUser);
    if(currentUser){
      CCompanies.app.models.BookingsV.find({where:{companyId:currentUser.companyId}},(err,data) => {
        //console.log('listRosters = ',err,data);
        cb(err,data);
      });
    }else{
      cb("Please log in",null);
    }

  }

  CCompanies.remoteMethod(
      'listBookings',
      {
        accepts: [{arg: 'criteria', type: 'object', http: {source: 'body'}}],
        returns: {arg: 'bookings', type: 'array'},
        http: {path: '/listBookings', verb: 'post'}
      }
  );

  CCompanies.listDoctors = function(criteria, cb) {
    var currentUser = loopback.getCurrentContext().active.currentUser;
    console.log('listDoctors criteria = ',criteria);
    console.log('listDoctors currentUser = ',currentUser);
    //currentUser.companyId
    if(currentUser || true){
      CCompanies.app.models.DoctorsV.find({where:{companyId:1},include:[
                                                                          {relation:'rosters',scope:{include:[
                                                                                                                {relation:'events'}
                                                                                                              ]}
                                                                          }
                                                                       ]},(err,data) => {
        //console.log('listRosters = ',err,data);
        cb(err,data);
      });
    }else{
      cb("Please log in",null);
    }

  }

  CCompanies.remoteMethod(
      'listDoctors',
      {
        accepts: [{arg: 'criteria', type: 'object', http: {source: 'body'}}],
        returns: {arg: 'doctors', type: 'array'},
        http: {path: '/listDoctors', verb: 'post'}
      }
  );

  CCompanies.listPatients = function(criteria, cb) {
    var currentUser = loopback.getCurrentContext().active.currentUser;
    console.log('listPatients criteria = ',criteria);
    console.log('listPatients currentUser = ',currentUser);
    if(!currentUser) currentUser = {};
    currentUser.companyId = 1;//temporary setting for development
    if(currentUser || true){
      var whereObject = {medicalCompanyId:currentUser.companyId};
      if(criteria && criteria.firstName){
        whereObject.firstName = {like:'%'+criteria.firstName+'%'}
      }
      if(criteria && criteria.lastName){
        whereObject.lastName = {like:'%'+criteria.lastName+'%'}
      }
      if(criteria && criteria.gender){
        whereObject.gender = {like:'%'+criteria.gender+'%'}
      }
      if(criteria && criteria.phone){
        whereObject.phone = {like:'%'+criteria.phone+'%'}
      }
      if(criteria && criteria.mobile){
        whereObject.mobile = {like:'%'+criteria.mobile+'%'}
      }
      if(criteria && criteria.email){
        whereObject.email = {like:'%'+criteria.email+'%'}
      }
      console.log('will filter with criteria = ',whereObject);
      CCompanies.app.models.PatientsV.find({where:whereObject},(err,data) => {
        console.log('listPatients = ',err,data);
        cb(err,data);
      });
    }else{
      cb("Please log in",null);
    }

  }

  CCompanies.remoteMethod(
      'listPatients',
      {
        accepts: [{arg: 'criteria', type: 'object', http: {source: 'body'}}],
        returns: {arg: 'patients', type: 'array'},
        http: {path: '/listPatients', verb: 'post'}
      }
  );

  CCompanies.createPatient = function(criteria, cb) {
    var currentUser = loopback.getCurrentContext().active.currentUser;
    console.log('createPatient criteria = ',criteria);
    console.log('createPatient currentUser = ',currentUser);
    if(!currentUser) currentUser = {};
    currentUser.companyId = 1;//temporary setting for development
    if(currentUser || true){
      let person = {
        "personId": 0,
        "isenable": 1,
        "title": criteria.title,
        "firstName": criteria.firstName,
        "lastName": criteria.lastName,
        "dob": criteria.dob,
        "gender": criteria.gender,
        "phone": criteria.phone,
        "mobile": criteria.mobile,
        "email": criteria.email,
        "occupation": "",
        "address": criteria.address,
        "suburbDistrict": criteria.suburbDistrict,
        "ward": criteria.ward,
        "postcode": "",
        "stateProvince": criteria.stateProvince,
        "country": criteria.country,
        "ispatient": 1,
        "isdoctor": 0,
        "avatarId": null,
        "signatureId": null,
        "sourceId": null
      };

      CCompanies.app.models.People.create(person,(err,per) => {
        console.log('createPatient.createPerson = ',err,per);
        if(err) cb(err,null);
        let patient = {
                          "patientId": 0,
                          "medicalCompanyId": currentUser.companyId,
                          "userId": null,
                          "personId": per.personId,
                          "isenable": 1
                        };
        CCompanies.app.models.Patients.create(patient,(err,pat)=>{
          console.log('createPatient.createPatient = ',err,pat);

          if(err) cb(err,null);
          let returnObject = Object.assign({},per.toJSON(),pat.toJSON());
          cb(err,returnObject);
        });
      });
    }else{
      cb("Please log in",null);
    }
  }

  CCompanies.remoteMethod(
      'createPatient',
      {
        accepts: [{arg: 'criteria', type: 'object', http: {source: 'body'}}],
        returns: {arg: 'patient', type: 'array'},
        http: {path: '/createPatient', verb: 'post'}
      }
  );

};
