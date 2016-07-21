module.exports = function(CDoctors) {

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
  
};
