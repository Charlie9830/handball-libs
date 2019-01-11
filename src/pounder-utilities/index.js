import Moment from 'moment';

const dateFormat = "DD-MM-YYYY";
const LONG_DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const SHORT_DAY_NAMES = ['mon', 'tues', 'tue', 'wed', 'thurs', 'thur', 'fri', 'sat', 'sun'];
const DAY_NAMES = LONG_DAY_NAMES.concat(SHORT_DAY_NAMES);

export function GetDisplayNameFromLookup(userId, memberLookup) {
  if (userId === undefined || userId === -1 || userId === "-1") {
      return "";
  }

  var displayName = memberLookup[userId];
  return displayName === undefined ? "" : displayName;
}


export function ParseDueDate(isComplete, dueDate) {
  if (isComplete) {
    return {
      type: "complete",
      text: ""
    }
  }

  if (dueDate === "") {
    return {
      type: "unset",
      text: ""
    }
  }

  var dueDate = new Moment(dueDate).hours(13);
  var currentDate = new Moment();
  var difference = dueDate.diff(currentDate, 'days');

  // Today.
  if (dueDate.isSame(currentDate, 'day')) {
    return {
      type: "today",
      text: "Today"
    }
  }

  // Tomorrow
  if (dueDate.calendar(currentDate).includes("Tomorrow")) {
    return {
      type: "soon",
      text: 1 + "d"
    }
  }

  // Overdue
  if (difference < 0) {
    return {
      type: "overdue",
      text: "Due"
    }
  }

  // Later On
  if (difference >= 1 && difference <= 6) {
    return {
      type: "later",
      text: (difference + 1) + "d"
    }
  }

  // At least a Week out.
  if (difference >= 7) {
    return {
      type: "later",
      text: Math.round(difference / 7) + "w"
    }
  }

  else {
    return {
      type: "unset",
      text: ""
    }
  }
}

export function getDayPickerDate(day) {
  return getNormalizedDate(new Moment(day, dateFormat));
}

export function getClearedDate() {
  return "";
}

export function getDaysForwardDate(daysForward) {
  var daysForwardNumber = Number.parseInt(daysForward);
  return getNormalizedDate(new Moment(new Date(), dateFormat).add(daysForwardNumber, 'd'));
}

export function getWeeksForwardDate(weeksForward) {
  return getNormalizedDate( new Moment(new Date(), dateFormat).add(weeksForward, 'w'));
}

export function getParsedDate(date) {
  return getNormalizedDate (new Moment(date, ["DD-MM-YY", "DD-MM-YYYY", "DD-MM"]));
}

export function getNormalizedDate(momentDate) {
    return momentDate.startOf('day').hours(2).toISOString();
}

export function isDayName(value) {
  return DAY_NAMES.some(function(name) {return name === value});
}

export function getDayNameDate(dayName) {
  var dayNumber = Moment(dayName, 'dddd').startOf('day').day();
  var currentDayNumber = Moment().day();

  if (dayNumber > currentDayNumber) {
      return getDaysForwardDate(dayNumber - currentDayNumber);
    }

  else {
    return getNormalizedDate(Moment().endOf('week').add(dayNumber + 1, 'd'));
  }
}

export function isChecklistDueForRenew(checklistSettings) {  
  var initialStartDate = checklistSettings.initialStartDate;
  var lastRenewDate = checklistSettings.lastRenewDate;
  var renewInterval = checklistSettings.renewInterval;

  // Determine the next renew Date. if lastRenewDate is blank, that means that the first renew hasn't occured yet. So just use
  // the inititalStartDate. Otherwise, combine lastRenewDate and renewInterval to get next Renew Date.
  var nextRenewDate = {};
  if (lastRenewDate === "") {
    nextRenewDate = Moment(initialStartDate);
  }

  else {
    nextRenewDate = Moment(lastRenewDate).add(renewInterval, 'd');
  }

  var currentDate = Moment();

  return nextRenewDate.diff(currentDate, 'seconds') < 0;
}

export function getDisplayNameFromLookup(lookup, userId) {
  if (lookup[userId] !== undefined) {
    return lookup[userId];
  }

  else {
    return ""
  }
}

export function getProjectLayoutType(projectId, members, userId) {
  var filteredMembers = members.filter(item => {
      return item.project === projectId;
  })

  var member = filteredMembers.find(item => {
      return item.userId === userId;
  })

  if (member === undefined || member.projectLayoutType === undefined) {
      // Return the Global Layout.
      return 'global';
  }

  else {
      // Return the Users local Layout.
      return member.projectLayoutType;
  }
}

