function toInt(value) {
  const n = parseInt(value, 10);
  return isNaN(n) ? 0 : n;
}

function addBookingRow(data) {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Bookings');
  const mezuzotCount = toInt(data.mezuzotCount);
  const tefillinCount = toInt(data.tefillinCount);
  sheet.appendRow([
    data.bookingDate,
    data.time,
    data.name,
    data.email,
    data.phone,
    data.notes,
    data.mezuzot,
    mezuzotCount,
    data.tefillin,
    tefillinCount,
  ]);
}
