var HEADERS = ['bookingDate','time','name','email','phone','notes','mezuzot','mezuzotCount','tefillin','tefillinCount','timestamp'];

function getSheetAndEnsureHeaders() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  var needSet = HEADERS.some(function (h, i) { return firstRow[i] !== h; });
  if (needSet) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  return sheet;
}

function getBusyTimesForDate(sheet, dateStr) {
  var data = sheet.getRange(2, 1, Math.max(0, sheet.getLastRow() - 1), HEADERS.length).getValues();
  var busy = [];
  data.forEach(function (row) {
    var d = row[0];
    if (d) {
      var dStr = (d instanceof Date) ? toDateFormatted(d) : d;
      if (dStr === dateStr) {
        busy.push(row[1]);
      }
    }
  });
  return busy;
}

function generateFreeSlots(dateStr, busyTimes) {
  var slots = [];
  for (var h = 10; h < 18; h++) {
    for (var m = 0; m < 60; m += 30) {
      var slot = Utilities.formatString('%02d:%02d', h, m);
      if (busyTimes.indexOf(slot) === -1) {
        slots.push(slot);
      }
    }
  }
  return slots;
}

function addBookingRow(sheet, data) {
  var required = ['bookingDate', 'time', 'name', 'email'];
  var missing = required.filter(function (f) { return !data[f]; });
  if (missing.length) {
    return jsonOut({ status: 'error', message: 'Missing fields: ' + missing.join(', ') });
  }
  var busy = getBusyTimesForDate(sheet, data.bookingDate);
  if (busy.indexOf(data.time) !== -1) {
    return jsonOut({ status: 'error', message: 'Slot already booked' });
  }
  sheet.appendRow([
    data.bookingDate,
    data.time,
    data.name,
    data.email,
    data.phone || '',
    data.notes || '',
    data.mezuzot ? 'TRUE' : 'FALSE',
    toInt(data.mezuzotCount),
    data.tefillin ? 'TRUE' : 'FALSE',
    toInt(data.tefillinCount),
    new Date()
  ]);
  return jsonOut({ status: 'ok', message: 'Booking added' });
}

function getAllBookings(sheet) {
  var data = sheet.getRange(2, 1, Math.max(0, sheet.getLastRow() - 1), HEADERS.length).getValues();
  return data.map(function (row) {
    return {
      bookingDate: row[0] ? toDateFormatted(row[0]) : '',
      time: row[1],
      name: row[2],
      email: row[3],
      phone: row[4],
      notes: row[5],
      mezuzot: row[6] === 'TRUE',
      mezuzotCount: toInt(row[7]),
      tefillin: row[8] === 'TRUE',
      tefillinCount: toInt(row[9]),
      timestamp: row[10]
    };
  });
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function toDateFormatted(date) {
  return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function toInt(val) {
  var n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

function getBusy(data) {
  var sheet = getSheetAndEnsureHeaders();
  var busy = getBusyTimesForDate(sheet, data.date);
  var free = generateFreeSlots(data.date, busy);
  return jsonOut({ busy: busy, free: free });
}

function getBookings(data) {
  var sheet = getSheetAndEnsureHeaders();
  var bookings = getAllBookings(sheet);
  return jsonOut({ bookings: bookings });
}

function addBooking(data) {
  var sheet = getSheetAndEnsureHeaders();
  return addBookingRow(sheet, data);
}

function doGet(e) {
  var data = e && e.parameter ? e.parameter : {};
  var action = data.action;
  if (!action) {
    return jsonOut({ status: 'error', message: 'No action provided' });
  }
  var handlers = { getBusy: getBusy, getBookings: getBookings, addBooking: addBooking };
  var fn = handlers[action];
  if (!fn) {
    return jsonOut({ status: 'error', message: 'Unknown action' });
  }
  return fn(data);
}

function doPost(e) {
  var data = {};
  if (e.postData && e.postData.contents) {
    data = JSON.parse(e.postData.contents);
  }
  return doGet({ parameter: data });
}

