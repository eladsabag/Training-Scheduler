//jshint esversion: 6

exports.getDate = function() {
  const today = new Date();
  let tommorow = new Date();
  tommorow.setDate(today.getDate());
  return tommorow.toLocaleDateString("en-GB");
};


exports.setInitialDates = function(size,newDateCase) {
  const today = new Date();
  const dates = [];
  const days = [];
  const hours = [];
  for(var i = 0; i < size; i++) {
      let nextDay = new Date();
      nextDay.setDate(today.getDate()+i+newDateCase);
      dates.push(nextDay.toLocaleDateString("en-GB"));
      days.push(nextDay.getDay());
      hours.push((setDayTrainings(nextDay.getDay())));
  }
  return {dates: dates, days: days, hours: hours};
};

function setDayTrainings(day) {
  let hours = [];
  switch(day) {
    case 0:
      hours = [{hour: "9:00",kind: "רגיל",occupied: false},{hour: "10:00",kind: "רגיל",occupied: false},{hour: "11:00",kind: "רגיל",occupied: false},{hour: "12:00",kind: "רגיל",occupied: false}];
    break;
    case 1:
      hours = [{hour: "9:00",kind: "רגיל",occupied: false},{hour: "10:00",kind: "רגיל",occupied: false},{hour: "11:00",kind: "רגיל",occupied: false},{hour: "12:00",kind: "רגיל",occupied: false}];
    break;
    case 2:
      hours = [{hour: "9:00",kind: "רגיל",occupied: false},{hour: "10:00",kind: "רגיל",occupied: false},{hour: "11:00",kind: "רגיל",occupied: false},{hour: "12:00",kind: "רגיל",occupied: false}];
    break;
    case 3:
      hours = [{hour: "9:00",kind: "רגיל",occupied: false},{hour: "10:00",kind: "רגיל",occupied: false},{hour: "11:00",kind: "רגיל",occupied: false},{hour: "12:00",kind: "רגיל",occupied: false}];
    break;
    case 4:
      hours = [{hour: "9:00",kind: "רגיל",occupied: false},{hour: "10:00",kind: "רגיל",occupied: false},{hour: "11:00",kind: "רגיל",occupied: false},{hour: "12:00",kind: "רגיל",occupied: false}];
    break;
    case 5:
      hours = [{hour: "9:00",kind: "רגיל",occupied: false},{hour: "10:00",kind: "רגיל",occupied: false},{hour: "11:00",kind: "רגיל",occupied: false},{hour: "12:00",kind: "רגיל",occupied: false}];
    break;
    case 6:
      hours = [{hour: "9:00",kind: "רגיל",occupied: false},{hour: "10:00",kind: "רגיל",occupied: false},{hour: "11:00",kind: "רגיל",occupied: false},{hour: "12:00",kind: "רגיל",occupied: false}];
    break;

    default:
      console.log("Error");
    break;

  }
  return hours;
}
