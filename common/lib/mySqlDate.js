var moment = require('moment');
var strsplit = require('strsplit');

module.exports.mySqlDateToMoment = function(dateSTR) {
    var dateInStr = dateSTR + '';
    if(dateSTR){
        console.log('dateSTR =',dateInStr,strsplit(dateInStr,/[- : T .]/));
        var t = dateInStr.split(/[- : T .]/);
        var dateinStrFormat = t[0]+'/'+t[1]+'/'+t[2]+' '+t[3]+':'+t[4]+':'+t[5];
        console.log(t,dateinStrFormat);
        // Apply each element to the Date function
        //var d = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
        //var myDate = new Date(dateSTR);
        //console.log(">>>apt date from send email = ",dateSTR,"   ",t,"   ",d);
        //console.log(myDate.getMonth()," ",myDate.getDay()," ",myDate.getYear());
        return moment(dateinStrFormat,'YYYY/MM/DD HH:mm:ss'); // No TZ subtraction on this sample
    }
    return null;
}

module.exports.mySqlDateToString = function(dateSTR) {
    if(dateSTR){
        var t = dateSTR.split(/[- : T .]/);
        var dateinStrFormat = t[0]+'/'+t[1]+'/'+t[2]+' '+t[3]+':'+t[4]+':'+t[5];
        //console.log(t,dateinStrFormat);
        return dateinStrFormat; // No TZ subtraction on this sample
    }
    return null;
}
