import {getCurrentUser, getFriendsList, getUserAreas, getGroups, getUserByID, getReq, patchReq, map} from './commun.js';
import { gotoArea, updateAreaMarkers } from './areas.js';

// ******************************************************************************************
// INIT 
// ******************************************************************************************

console.log("wesh la famille!");
let currentUser = undefined;//JSON.parse(document.getElementById('current_user').textContent);
let userGroups = undefined;
let userAreas = undefined;
let userFriends = undefined;

let userNotifications = [];

let isOpenPanel = false;
//let isLockedPanel = true;

// Set interval for notification recuperation
let updateTime = 3000; 

// set current time one hour before the user connexion time
// used to get previous notifications (message max duration is one hour)
/* let currentTime = new Date();
currentTime.setHours( currentTime.getHours() - 1 )
currentTime = currentTime.toJSON() */


// ******************************************************************************************
// INIT 
// ******************************************************************************************

/**
 * Get currentUser and update current user group list
 */
async function init() {
    currentUser = await getCurrentUser();
    await updateAll();
} 
init();

/*
 * Update current user group list
 */
async function updateUserGroups() { userGroups = await getGroups(currentUser.id); }
/*
 * Update current user areas list
 */
async function updateUserAreas() { userAreas = await getUserAreas(currentUser.id); }
/*
 * Update current user friends
 */
async function updateUserFriends() {userFriends = await getFriendsList(currentUser.id); } 
/*
 * Update current user areas, groups and friends
 */
async function updateAll() {
    await updateUserGroups();
    await updateUserAreas();
    await updateUserFriends();
}


// ******************************************************************************************
// CHECK NEW NOTIFICATIONS 
// ******************************************************************************************

/**
 * Checks new notifications incomming
 * new notifications are push in userNotifications via updateUserNotifications() (formatting)
 * if userNotification not empty : turn on the notification button
 * else turn off notification button
 */
setInterval( async function() {
    await updateAll()
    await getReq( "/area/notify" );
    let newNotifs = await getReq("/notifications/list");
    if( newNotifs.length ) {
        await updateUserNotifications( newNotifs );
    }
    if( userNotifications.length ) turnOnBellBtn();
    else turnOffBellBtn();
}, updateTime);



/*
 * Update current user notifications list
 */
async function updateUserNotifications( newNotifs ) {
    newNotifs.forEach( async function(notif) {
        if (notif.object === "message") {
            let newNotif = await getNotifMessageDetails( notif )
            userNotifications.push( newNotif );
        }
        if (notif.object === "user") {
            let newNotif = await getNotifUserDetails( notif )
            userNotifications.push( newNotif );    
        }
        if (notif.object === "join_group") {
            let newNotif = await getNotifGroupDetails( notif )
            userNotifications.push( newNotif );    
        }
        if (notif.object === "invit_group") {
            let newNotif = await getNotifGroupDetails( notif )
            userNotifications.push( newNotif );    
        }
        if( notif.object === "area" ) {
            let newNotif = await getNotifAreaDetails( notif )
            updateAreaMarkers( newNotif.area );
            userNotifications.push( newNotif );  
        }
    });
    initNotificationsListener();
}

/**
 * Update number of notification
 * Used for local usage
 */
function updateBellCount() {
    $('.notification-btn-count').html( userNotifications.length );
}
/**
 * Turn on the notification button
 */
function turnOnBellBtn() {
    $('.notifications-btn-icon-empty').hide();
    $('.notification-btn-count').html( userNotifications.length );
    $('.notification-btn-count').removeClass("hide");
    $('.notifications-btn-icon-full').removeClass("hide");
    $('.notifications-btn-text').css("font-weight", "bold");
}

/**
 * Turn off the notification button
 */
function turnOffBellBtn() {
    $('.notifications-btn-icon-empty').show();
    $('.notification-btn-count').addClass("hide");
    $('.notifications-btn-icon-full').addClass("hide");
    $('.notifications-btn-text').css("font-weight", "normal");
}




// ******************************************************************************************
// UTILS
// ******************************************************************************************

/* function encodeAttribute( attr ) { return encodeURIComponent(JSON.stringify(attr)); };
function decodeAttribute( attr ) { return JSON.parse(decodeURIComponent(attr)); } */




// ******************************************************************************************
// OPEN GROUP PANEL
// ******************************************************************************************

// get open panel button, the header of panel and content of panel
let notifBtn = document.getElementById("notifications-panel-btn");
let notifHeader = document.getElementById("notifications-panel").getElementsByClassName("cd-panel__header")[0].getElementsByTagName("h3")[0];
let notifContent = document.getElementById("tab-notif-friends");


/**
 * Click on btn notification panel
 */
notificationsBtn = document.getElementById("notifications-panel-btn");
notificationsBtn.onclick = async function() {
     if( !isOpenPanel ) await initNotificationsListener();
     isOpenPanel = togglePanel( notificationsBtn.id, "notifications-panel" );
}


// ******************************************************************************************
// HTML CONTENT
// ******************************************************************************************
//<div class="mt-0">${ntf.typeTo} : <b>${ntf.to.name}</b></div>

/**
 * Returns the html content of notification list
 * @param {} userNotifications : list of notifications to display
 */
function getHtmlNotifList( userNotifications ) {
    let content = `<ul class="list-group">`;
    let index = 0;
    userNotifications.forEach( ntf => {
        if( ntf.object === "message" ) {
            content += `
                <div class="media position-relative item-list message-item">
                    <div > <i class="metismenu-icon pe-7s-mail pe-3x pe-va"></i> </div>
                    <div class="media-body item-list-name">
                        <div class="mt-0"><b>${ntf.from.name}</b> published in ${ntf.typeTo} <b>${ntf.to.name} </b></div>
                    </div>
                    <div class="btn-group">
                        <button type="button" class="btn btn-dark item-btn-acc" data-type="message" data-lon="${ntf.lon}" data-lat="${ntf.lat}" data-index="${index}">Go to</button>
                        <button type="button" class="btn btn-dark item-btn-del" data-index="${index}">Delete</button>
                    </div>
                </div>`
        }
        if( ntf.object === "user" ) {
            content += `
                <div class="media position-relative item-list message-item">
                    <div > <i class="metismenu-icon pe-7s-add-user pe-3x pe-va"></i> </div>
                    <div class="media-body item-list-name">
                        <div class="mt-0"><b>${ntf.from.name}</b> want to be your friend</div>
                    </div>
                    <div class="btn-group">
                        <button type="button" class="btn btn-dark item-btn-acc" data-index="${index}" data-type="friend" data-friend="${ntf.from.id}">Accept</button>
                        <button type="button" class="btn btn-dark item-btn-del" data-index="${index}">Reject</button>
                    </div>
                </div>`
        }
        if( ntf.object === "join_group" ) {
            content += `
                <div class="media position-relative item-list message-item">
                    <div > <i class="metismenu-icon pe-7s-users pe-3x pe-va"></i> </div>
                    <div class="media-body item-list-name">
                        <div class="mt-0"> <b>${ntf.from.name}</b> want to join the group <b>${ntf.group.name}</b></div>
                    </div>
                    <div class="btn-group">
                        <button type="button" class="btn btn-dark item-btn-acc" data-index="${index}" data-type="join" data-user="${ntf.from.id}" data-group="${ntf.group.id}">Accept</button>
                        <button type="button" class="btn btn-dark item-btn-del" data-index="${index}">Reject</button>
                    </div>
                </div>`
        }
        if( ntf.object === "invit_group" ) {
            content += `
                <div class="media position-relative item-list message-item">
                    <div > <i class="metismenu-icon pe-7s-users pe-3x pe-va"></i> </div>
                    <div class="media-body item-list-name">
                        <div class="mt-0"> <b>${ntf.from.name}</b> invit jou to join the group <b>${ntf.group.name}</b></div>
                    </div>
                    <div class="btn-group">
                        <button type="button" class="btn btn-dark item-btn-acc" data-index="${index}" data-type="join" data-user="${currentUser.id}" data-group="${ntf.group.id}">Accept</button>
                        <button type="button" class="btn btn-dark item-btn-del" data-index="${index}">Reject</button>
                    </div>
                </div>`
        }
        if( ntf.object === "area" ) {
            content += `
                <div class="media position-relative item-list message-item">
                    <div > <i class="metismenu-icon pe-7s-users pe-3x pe-va"></i> </div>
                    <div class="media-body item-list-name">
                        <div class="mt-0"> <b>You have ${ntf.message}</b> new messages in the area  <b>${ntf.area.name}</b></div>
                    </div>
                    <div class="btn-group">
                        <button type="button" class="btn btn-dark item-btn-acc" data-type="area" data-area="${ntf.area.id}" data-lon="${ntf.lon}" data-lat="${ntf.lat}" data-index="${index}">Go to</button>
                        <button type="button" class="btn btn-dark item-btn-del" data-index="${index}">Delete</button>                    
                    </div>
                </div>`
        }
        index += 1;
    });
    return content += "</ul>"
}


// ******************************************************************************************
// FROMAT NOTIFS
// ******************************************************************************************


/**
 * Get the detail of message notifications
 * @param {} notif
 */
async function getNotifMessageDetails( notif ) {
    let from = userFriends.find( frd => frd.id === notif.from );
    if( !from ) from = await getUserByID( notif.from );
    let pk = parseInt( notif.group_pks );
    let group = userGroups.find( usrGrp => usrGrp.id === pk );
    return {object:notif.object, from:from, lon:notif.lon, lat:notif.lat, typeTo:"group", to:group};
}


/**
 * Get the detail of user notifications
 * @param {} notif
 */
async function getNotifUserDetails( notif ) {
    let from = await getUserByID( notif.from );
    return { object:notif.object, from:from };
}

/**
 * Get the detail of a group notifications
 * @param {} notif
 */
async function getNotifGroupDetails( notif ) {
    let from = await getUserByID( notif.from );
    let group = await getReq( 'group/' + notif.group );
    return { object:notif.object, from:from, group:group  };
}

/**
 * Get the detail of an area notifications
 * @param {} notif
 */
async function getNotifAreaDetails( notif ) {
    let area = await getReq( '/area/'+ notif.area_id )
    return { object:notif.object, area:area, lon:notif.lon, lat:notif.lat, message:notif.message  };
}

// ******************************************************************************************
// LISTENERS
// ******************************************************************************************

/**
 * Listener => Fill initial right-side group panel
 */
async function initNotificationsListener() {
    await updateAll()

    // fill initial group panel
    notifHeader.innerHTML = `Notifications`;
    notifContent.innerHTML = getHtmlNotifList( userNotifications );

    // attach listener to all delete buttons
    let notifDelBtns = [...document.getElementsByClassName("item-btn-del")];
    notifDelBtns.forEach( btn => btn.addEventListener( 'click', () => notificationDelListener(btn) ));


    // attach listener to all accept buttons
    let notifAccBtns = [...document.getElementsByClassName("item-btn-acc")];
    notifAccBtns.forEach( btn => btn.addEventListener( 'click', () => notificationAccListener(btn) ));
}


/**
 * Listener => react to an notification acception depending on data-type
 * Call notificationDelListener to delete the notification
 * @param {*} btn
 */
async function notificationAccListener( btn ) {
    let type = btn.getAttribute("data-type");

    if( type === "area" ) {
        let areaID = parseInt( btn.getAttribute("data-area"));
        await gotoArea( areaID, true );
    }
    if( type === "message") {
        let lat = parseFloat( btn.getAttribute("data-lat") );
        let lon = parseFloat( btn.getAttribute("data-lon") );
        let offsetValue = (map.getBounds()._northEast.lng - map.getBounds()._southWest.lng)/4;
        map.panTo(new L.LatLng(lat, lon+offsetValue));
        //map.setView( new L.LatLng(lat, lon), 12 );
    }
    if( type === "friend") {
        let friendID = parseInt( btn.getAttribute("data-friend"));
        let URL = 'user/friends/add/' + currentUser.id;
        await patchReq( URL, {"friendList": friendID} )
    }
    if( type === "join") {
        let userID = parseInt( btn.getAttribute("data-user"));
        let groupID = parseInt( btn.getAttribute("data-group"));
        let URL = 'group/members/add/' + groupID;
        await patchReq( URL, {"users": userID} );
    }

    await notificationDelListener(btn);

}

/**
 * Listener => delete an notification on a rejection
 * @param {*} btn
 */
async function notificationDelListener( btn ) {
    //let notification = decodeAttribute( btn.getAttribute("data-notif") );
    let index =  parseInt( btn.getAttribute("data-index") );
    userNotifications.splice( index, 1 );
    if( !userNotifications.length ) {
        togglePanel( "notifications-panel-btn", "notifications-panel" );
        turnOffBellBtn();

    }
    else updateBellCount();
    await initNotificationsListener();
}


// ******************************************************************************************
// API CALLS
// ******************************************************************************************

/**
 * Get notifications of current user
 */
/* function getNotifications(){
    return new Promise(
        resolve => {
            let URL = "/notifications/list";

            $.ajax( {
                type: "GET",
                headers: getAccessHeaders("application/json"),
                url: URL,
            success: (data) => {
                resolve(data.result);
            },
            error: (res) => {
                console.log(res.status);
                if(res.status === 401)
                    showAlert("You're not authenticated");
                else
                    showAlert( "Bad request !" );
            },
            fail: () => {
                showAlert( "Server unreachable !" );
            }
            });
        }
    )
} */






