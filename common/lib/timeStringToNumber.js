
module.exports =  function(timeInStr){
  var timeArray = (timeInStr+'').split(':');
  //console.log('timeStringToNumber =',timeArray);
  if(timeArray.length >=2){
    return Number(timeArray[0])*60 + Number(timeArray[1]);
  }else{
    return 0;
  }
};
