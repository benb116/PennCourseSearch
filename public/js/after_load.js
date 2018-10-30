//runs after the page is loaded

//shows update modal on first open of updated site
if(localStorage.lastUpdateNotification === undefined || localStorage.lastUpdateNotification !== "10/30"){
    activate_modal(document.getElementById("NotificationModal"));
    localStorage.lastUpdateNotification = "10/30";
}