function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSheet();
  if (data.action) {
    if (data.action === "getBookings") {
      // Existing action placeholder
      return ContentService.createTextOutput(JSON.stringify({
        status: "ok",
        message: "getBookings not implemented"
      })).setMimeType(ContentService.MimeType.JSON);
    } else if (data.action === "addBooking") {
      var required = ["bookingDate", "time", "name", "email"];
      var missing = required.filter(function(field) { return !data[field]; });
      if (missing.length > 0) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Missing fields: " + missing.join(", ")
        })).setMimeType(ContentService.MimeType.JSON);
      }
      return addBookingRow(sheet, data);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Unknown action"
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({
    status: "error",
    message: "No action provided"
  })).setMimeType(ContentService.MimeType.JSON);
}
