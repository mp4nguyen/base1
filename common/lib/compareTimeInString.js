var timeStringToNumber = require('./timeStringToNumber');

module.exports =  function(fromTimeOut,toTimeOut,fromTimeIn,toTimeIn){
  var fromTimeOutInNumber = timeStringToNumber(fromTimeOut);
  var toTimeOutInNumber = timeStringToNumber(toTimeOut);
  var fromTimeInInNumber = timeStringToNumber(fromTimeIn);
  var toTimeInInNumber = timeStringToNumber(toTimeIn);
  console.log(fromTimeOut,'-',toTimeOut,':',fromTimeIn,'-',toTimeIn);
  console.log(fromTimeOutInNumber,'-',toTimeOutInNumber,':',fromTimeInInNumber,'-',toTimeInInNumber);
  if((fromTimeOutInNumber <= fromTimeInInNumber && fromTimeInInNumber <= toTimeOutInNumber )||
      (fromTimeOutInNumber <= toTimeInInNumber && toTimeInInNumber <= toTimeOutInNumber )){
      return true;
  }else{
    return false;
  }
};
