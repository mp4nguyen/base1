var moment = require('moment');
var _ = require('underscore');
var compareTimeInString = require('../lib/compareTimeInString');

module.exports = function(CCalendars) {

    CCalendars.generateCalendars = function(roster){

        /*
      { rosterId: 509,
      repeatType: 'WEEKLY',
      doctorId: 2,
      workingSiteId: 3,
      bookingTypeId: 1,
      timeInterval: 15,
      fromDate: Mon Nov 28 2016 08:00:00 GMT+0800 (AWST),
      toDate: Mon Nov 28 2016 17:00:00 GMT+0800 (AWST),
      dayOfWeek: 'Mo' },*/
      ///only new roster that not link to the existing cal is generated its cals
      var gen = function(existingCal){
        var cals = [];
        var fromTime = moment(roster.fromDate);
        var toTime = moment(roster.toDate);

        while(fromTime.isBefore(toTime)){
            if(!existingCal){
              pfromTime = fromTime.format('YYYY-MM-DD HH:mm');
              ptoTime = fromTime.add((roster.timeInterval-1),'m').format('YYYY-MM-DD HH:mm');
              var calendar = {
                              calendarId : 0,
                              companyId: roster.companyId,
                              rosterId : roster.rosterId,
                              doctorId : roster.doctorId,
                              clinicId : roster.workingSiteId,
                              bookingTypeId : roster.bookingTypeId,
                              timeInterval : roster.timeInterval,
                              fromTime : pfromTime,
                              toTime: ptoTime
                          };
              cals.push(calendar);
              fromTime.add(1,'m');
            }else{
              //if there is the existing cal => prevent to gen 2 cals in the same time
              var eapptFromTime = moment(existingCal.fromTime).add(existingCal.fromTime.getTimezoneOffset(),"m");
              var eapptFromTime2 = eapptFromTime.format("HH:mm");
              var eapptToTime = moment(existingCal.toTime).add(existingCal.toTime.getTimezoneOffset(),"m");
              var eapptToTime2 = eapptToTime.format("HH:mm");

              var pfromDateTimeInStr = fromTime.format('YYYY-MM-DD HH:mm');
              var pfromTimeInSrt = fromTime.format('HH:mm');

              var ptoTime = fromTime.add((roster.timeInterval-1),'m');
              var ptoDateTimeInStr = ptoTime.format('YYYY-MM-DD HH:mm');
              var ptoTimeInSrt = ptoTime.format('HH:mm');
              fromTime.add(1,'m');
              //console.log(pfromTimeInSrt,' - ',ptoTimeInSrt,' : ',eapptFromTime2,eapptToTime2);
              if(!compareTimeInString(pfromTimeInSrt,ptoTimeInSrt,eapptFromTime2,eapptToTime2)){
                var calendar = {
                                calendarId : 0,
                                companyId: roster.companyId,
                                rosterId : roster.rosterId,
                                doctorId : roster.doctorId,
                                clinicId : roster.workingSiteId,
                                bookingTypeId : roster.bookingTypeId,
                                timeInterval : roster.timeInterval,
                                fromTime : pfromDateTimeInStr,
                                toTime: ptoDateTimeInStr
                            };
                console.log('will gen cal=',calendar);
                cals.push(calendar);
              }else {
                console.log('update existing  cal=',existingCal);
                CCalendars.update({calendarId:roster.forCalId},{rosterId: roster.rosterId},(err,data)=>{
                    console.log('update roster for CCalendars ',err,data);
                });
                CCalendars.app.models.PatientAppointments.update({calendarId:roster.forCalId},{rosterId: roster.rosterId},(err,data)=>{
                    console.log('update roster for PatientAppointments ',err,data);
                });
              }
            }
        }

        //console.log('cals = ',cals);
        CCalendars.create(cals,function(err,data){
            //console.log('after inserted roster',err,data);
        });
      };

      console.log('will generate calendar with roster = ',roster);
      if(!roster.forCalId){
        gen(null);
      }else {
        //if new roster for existing calId => need to check to prevent gen cal that has time the same to the existing cal
        //and then, update rosterid of the existing cal to new rosterId
        CCalendars.find({where:{calendarId:roster.forCalId}},(err,data)=>{
          console.log('find existing cal = ',err,data);
          if(data.length ==0){
            gen();
          }else{
            gen(data[0]);
          }

        });
      }
    };
};
