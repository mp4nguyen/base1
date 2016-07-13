module.exports = function(CCompanies) {
    
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
