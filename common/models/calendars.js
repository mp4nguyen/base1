var moment = require('moment');
var _ = require('underscore');

module.exports = function(CCalendars) {

    CCalendars.generateCalendars = function(roster){

/*         { rosterId: 509,
    repeatType: 'WEEKLY',
    doctorId: 2,
    workingSiteId: 3,
    bookingTypeId: 1,
    timeInterval: 15,
    fromDate: Mon Nov 28 2016 08:00:00 GMT+0800 (AWST),
    toDate: Mon Nov 28 2016 17:00:00 GMT+0800 (AWST),
    dayOfWeek: 'Mo' },*/

        var cals = [];
        var fromTime = moment(roster.fromDate);
        var toTime = moment(roster.toDate);

        while(fromTime.isBefore(toTime)){

            var calendar = {
                            calendarId : 0,
                            rosterId : roster.rosterId,
                            doctorId : roster.doctorId,
                            clinicId : roster.workingSiteId,
                            bookingTypeId : roster.bookingTypeId,
                            timeInterval : roster.timeInterval,
                            fromTime : fromTime.format('YYYY-MM-DD HH:mm'),
                            toTime: fromTime.add(roster.timeInterval,'m').format('YYYY-MM-DD HH:mm')         
                        };
            
            //console.log("CAL = ",calendar);
            
            cals.push(calendar);
                                    
        }

        console.log('cals = ',cals);
        CCalendars.create(cals,function(err,data){
            console.log('after inserted roster',err,data);            
        });  

    };
};
