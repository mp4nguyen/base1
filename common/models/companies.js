var loopback = require('loopback');

module.exports = function(CCompanies) {

  CCompanies.initData = function(cb) {

      var currentUser = loopback.getCurrentContext().active.currentUser;
      var companyData = {};
      console.log('CCompanies.initData currentUser=',currentUser);
      if(currentUser && currentUser.userType.indexOf("ADMIN") >= 0){
          //check if the user is admin  ; if yes, return all bookings
          CCompanies.find({
            include:[
                      {relation:'Clinics',scope:{include:[
                                                            {relation:'BookingTypes'},
                                                            {relation:'Doctors',scope:{include:'Person'}}
                                                         ]}},
                      {relation:'Doctors',scope:{include:[
                                                            {relation:'Person'},
                                                            {relation:'Clinics'},
                                                            {relation:'BookingTypes'},
                                                            {relation:'Rosters',scope:{include:['BookingType','Clinic']}}
                                                         ]}}
                      ]
          },function(err,data){
            companyData = data[0];
            cb(null,data);
          });

      }else if(currentUser && currentUser.userType.indexOf("COMPANY") >= 0){
          CCompanies.find( {
            where:{companyId:currentUser.companyId},
            include:[
                      {relation:'Clinics',scope:{include:[
                                                            {relation:'BookingTypes'},
                                                            {relation:'Doctors',scope:{include:'Person'}}
                                                         ]}},
                      {relation:'Doctors',scope:{include:[
                                                            {relation:'Person'},
                                                            {relation:'Clinics'},
                                                            {relation:'BookingTypes'},
                                                            {relation:'Rosters',scope:{include:['BookingType','Clinic']}}
                                                         ]}}
                      ]
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
};
