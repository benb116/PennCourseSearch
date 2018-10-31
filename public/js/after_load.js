//runs after the page is loaded

//shows update modal on first open of updated site
if(localStorage.lastUpdateNotification === undefined || localStorage.lastUpdateNotification !== "2.0"){
    activate_modal(document.getElementById("NotificationModal"));
    localStorage.lastUpdateNotification = "2.0";
}