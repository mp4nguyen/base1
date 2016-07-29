var moment = require('moment');
var _ = require('underscore');
var mySqlDate = require('../lib/mySqlDate');
var compareTimeInString = require('../lib/compareTimeInString');

module.exports = function(CRosters) {

    CRosters.generateRoster = function(def, cb) {
      	/*
      	"def":{
            "rosterId": 1,
      			"doctorId":1,
      			"workingSiteId": 1,
      			"bookingTypeId": 2,
      			"timeInterval": 15,
      			"fromTime": "09:00",
      			"toTime": "16:00",
      			"fromDate":"2016-05-20",
      			"toDate":"2016-10-20",
      			"repeatType":"DAILY",
      			}
      	repeatType = [DAILY,WEEKLY,MONTHLY,2WEEKLY,3WEEKLY,5WEEKLY,6WEEKLY,7WEEKLY,8WEEKLY,]
      	*/

        ///Begin New code with transaction
        CRosters.beginTransaction({isolationLevel: CRosters.Transaction.READ_COMMITTED}, function(errTran, tx) {
            if(errTran){
                console.log("Packages.beginTransaction ", errTran);
                cb(errTran,null);
            }else{
              //////////////////////////////////////////////////////////////////////////
              console.log('----------------------generateRoster-------------------------');
              console.log('para = ',def);
              var repeatType = def.repeatType;
              var fromDate = moment(def.fromDate);
              var toDate = moment(def.toDate);
              var pFromDate = moment(def.fromDate);
              var pToDate = moment(def.toDate);
              var fromTime = def.fromTime;
              var toTime = def.toTime;
              var fromTimeInNumber = def.fromTime;
              var toTimeInNumber = def.toTime;
              var oldRosterIds = [];
              var calIds = [];
              var existingRosters = [];
              pToDate.add(1,'d');
              //will find all roster of the doctor within from date - to Date
              //If have the roster in fromtime - totime => remove the roster and re-reate the new roster
              // still skip the appts having the patients
              CRosters.find({where:{doctorId:def.doctorId,fromDate:{between:[pFromDate,pToDate]}}},function(err,data){
                //console.log('find old roster',err,data);
                //find all roster having from time - to time => we can delete
                data.map((cal)=>{
                  console.log('checking cal=',cal);
                  var apptFromTime = moment(cal.fromDate).add(cal.fromDate.getTimezoneOffset(),"m");
                  var apptFromTime2 = apptFromTime.format("HH:mm");
                  var apptToTime = moment(cal.toDate).add(cal.toDate.getTimezoneOffset(),"m");
                  var apptToTime2 = apptToTime.format("HH:mm");
                  console.log(' apptTime = ',apptFromTime2, '  - ', apptToTime2,'compare to fromTime =',fromTime,'toTime=',toTime);

                  if(compareTimeInString(fromTimeInNumber,toTimeInNumber,apptFromTime2,apptToTime2)){
                      oldRosterIds.push(cal.rosterId);
                      //some roster is generated for the existing patient => the existing patient link to the deleted roster
                      //=> can not use rosterId to find the calendars => we need to keep forCalId to find all existing appts to re-create the roster
                      if(cal.forCalId){
                        calIds.push(cal.forCalId);
                      }
                      console.log('cal.rosterId=',cal.rosterId,' apptTime = ',apptFromTime2, '  - ', apptToTime2,' will be replace by fromTime =',fromTime,'toTime=',toTime);
                  }
                });
                console.log('oldRosterIds =',oldRosterIds);
                ////if there is any roster in from time - to time => delete roster
                if(oldRosterIds.length > 0){
                    //some roster is generated for the existing patient => the existing patient link to the deleted roster
                    //=> can not use rosterId to find the calendars => we need to keep forCalId to find all existing appts to re-create the roster
                    //=> when filter appts, need to find all appts belong to oldRosterIds and all appts with re-create roster link to it
                    CRosters.app.models.PatientAppointments.find({where:{or:[{rosterId:{inq:oldRosterIds}},{calendarId:{inq:calIds}}]}},(err,appts)=>{
                        console.log('find calendars = ',err,appts);
                        //loop through all existing appts and then create the new roster for these appts
                        appts.map(appt=>{
                          console.log('appt.requireDate = ',appt.requireDate);
                          calIds.push(appt.calendarId);

                          existingRosters.push({
                            rosterId: 0,
                            repeatType : 'DAILY',
                            doctorId : appt.doctorId,
                            workingSiteId : appt.clinicId,
                            bookingTypeId : appt.bookingTypeId,
                            timeInterval : appt.duration,
                            fromDate: moment(appt.requireDate).add(appt.requireDate.getTimezoneOffset(),"m").format("YYYY-MM-DD HH:mm:ss"),
                            toDate: moment(appt.requireDate).add(appt.requireDate.getTimezoneOffset(),"m").add(appt.duration,'m').format("YYYY-MM-DD HH:mm:ss"),
                            forCalId: appt.calendarId
                          });
                        });

                        console.log('existingRosters = ',existingRosters);

                        CRosters.destroyAll({rosterId:{inq:oldRosterIds}},{transaction: tx},function(err,data){
                          console.log('delete old roster =',err,data);
                          if(err){
                            console.log('fail to delete old roster err = ',err);
                            tx.rollback(function(tranErr) {
                                   console.log("Error to rollback the transaction", tranErr);
                                   var returnObj = {};
                                   returnObj.err = "'" + err + "'";
                                   returnObj.tranErr = tranErr;
                                   //cb(returnObj,null);
                               });
                          }else{
                            CRosters.app.models.CCalendars.destroyAll({rosterId:{inq:oldRosterIds},calendarId:{nin:calIds}},{transaction: tx},function(err,data){
                              console.log('delete old calendars but keep occupied cals',err,data);
                              if(err){
                                console.log('fail to delete old calendars err = ',err);
                                tx.rollback(function(tranErr) {
                                       console.log("Error to rollback the transaction", tranErr);
                                       var returnObj = {};
                                       returnObj.err = "'" + err + "'";
                                       returnObj.tranErr = tranErr;
                                       //cb(returnObj,null);
                                   });
                              }else{
                                generateRoster(tx,def,cb,existingRosters);
                              }
                            });
                          }
                        });
                    });
                  }else{
                    //begin new roster
                    generateRoster(tx,def,cb);
                    //End new roster
                  }
              });
              //////////////////////////////////////////////////////////////////////////

            }
        });
        ///End new code with transaction
    }

    CRosters.remoteMethod(
        'generateRoster',
        {
          accepts: [{arg: 'def', type: 'object', http: {source: 'body'}}],
          returns: {arg: 'rosters', type: 'array'},
          http: {path: '/generateRoster', verb: 'post'}
        }
    );

    var timeStringToNumber = function(timeInStr){
      var timeArray = timeInStr.split(':');
      //console.log('timeStringToNumber =',timeArray);
      if(timeArray.length >=2){
        return Number(timeArray[0])*60 + Number(timeArray[1]);
      }else{
        return 0;
      }
    };

    var generateRoster = function(tx,def,cb,existingRosters){
      //Begin gen roster
      var repeatType = def.repeatType;
      var fromDate = moment(def.fromDate);
      var toDate = moment(def.toDate);
      var pFromDate = moment(def.fromDate);
      var pToDate = moment(def.toDate);
      var fromTime = def.fromTime;
      var toTime = def.toTime;
      var rosterDate = fromDate;
      var rosters = existingRosters;
      var rosterErrors = [];
      pToDate.add(1,'d');

      while(rosterDate.isSameOrBefore(toDate)){

          var roster = {
                          rosterId: 0,
                          repeatType : def.repeatType,
                          doctorId : def.doctorId,
                          workingSiteId : def.workingSiteId,
                          bookingTypeId : def.bookingTypeId,
                          timeInterval : def.timeInterval
                      };

          //console.log('doing something... at ',rosterDate.format('dd DD/MM/YYYY'),' repeatType = ',repeatType,def.repeatType);

          roster.fromDate = rosterDate.format('YYYY-MM-DD') + ' ' + fromTime;
          roster.toDate = rosterDate.format('YYYY-MM-DD') + ' ' + toTime;
          roster.dayOfWeek = rosterDate.format('dd');

          var willGenFromTime = timeStringToNumber(fromTime);
          var willGenToTime = timeStringToNumber(toTime);

          //checking the new roster whether covers the existing roster or not
          //if cover the existing roster, => remove the existing roster and then
          //update the caledar of the existing roster with the new roster id
          existingRosters.map((eroster,index)=>{
            //if the rosterDate of new roster == fromDate of existing roster => compare time to find out overlap or not
            if(rosterDate.isSame(moment(eroster.fromDate,'YYYY-MM-DD'))){
              var fromTimeInStr = (moment(eroster.fromDate,'YYYY-MM-DD HH:mm:ss').format('HH:mm'));
              var toTimeInStr = (moment(eroster.toDate,'YYYY-MM-DD HH:mm:ss').format('HH:mm'));
              if(compareTimeInString(fromTime,toTime,fromTimeInStr,toTimeInStr)){
                  roster.forCalId = eroster.forCalId;
                  existingRosters.splice(index,1);
                  console.log('remove existingRosters from list ',existingRosters);
              }
            }
          });

          rosters.push(roster);


          if(repeatType == 'DAILY'){
              rosterDate.add(1,'d');
          }else if(repeatType == 'WEEKLY'){
              rosterDate.add(1,'w');
          }else if(repeatType == 'MONTHLY'){
              rosterDate.add(1,'M');
          }else if(repeatType == '2WEEKLY'){
              rosterDate.add(2,'w');
          }else if(repeatType == '3WEEKLY'){
              rosterDate.add(3,'w');
          }else if(repeatType == '4WEEKLY'){
              rosterDate.add(3,'w');
          }else if(repeatType == '5WEEKLY'){
              rosterDate.add(5,'w');
          }else if(repeatType == '6WEEKLY'){
              rosterDate.add(6,'w');
          }else if(repeatType == '7WEEKLY'){
              rosterDate.add(7,'w');
          }else if(repeatType == '8WEEKLY'){
              rosterDate.add(8,'w');
          }else{
              break;
          }
      }

      //console.log(rosters);
      CRosters.create(rosters,{transaction: tx},function(err,data){
        console.log('after inserted roster',err,data);
        if(err){
            console.log("Packages.beginTransaction ", err);
            tx.rollback(function(tranErr) {
                console.log("Error to rollback the transaction", tranErr);
                var returnObj = {};
                returnObj.err = "'" + err + "'";
                returnObj.tranErr = tranErr;
                //cb(returnObj,null);
            });
        }else{
            //console.log("candidate added",err,bookingCandidates);
            tx.commit(function(tranErr) {
                console.log("created package assessments = " ,tranErr);
            });
            CRosters.app.models.RostersV.find({where:{doctorId:def.doctorId}},function(err,data){
              //console.log('listRosters = ',err,data);
              cb(err,data);
            });
            data.map(function(roster){
                CRosters.app.models.CCalendars.generateCalendars(roster);
            });
        }
      });
      //End gen roster
    };


};
