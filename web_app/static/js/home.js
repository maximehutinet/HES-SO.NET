import {map, msg_layer, areas_layer, getCurrentUser, getGroups, showAlert, getUserByID, getReq, postReq, deleteReq, patchReq, updateChatFriendsList} from './commun.js';
import { openAreaPanelCreator } from './areas.js';

/**
 * Global variables
 */
var positionMarker = {};
var accuracyAreaZone = {};
var areaVisibilityMessage = {};
var msgPosition = {};
var defaultRadius = 5;
var defaultDuration = 1;
let currentUser = undefined;
let userGroups = undefined;
let markers = {};

let userlat = undefined;
let userlon = undefined;
let isLocated = false;


async function init() {
    currentUser = await getCurrentUser();
    await updateUserGroups();
    $('#id_email').val(currentUser.email);
    $('#id_email').removeClass("is-invalid");
    $('#id_name').removeClass("is-invalid");
    $('#id_visibility').removeClass("is-invalid");
} 
init();

$('.icon-hidden').hide();

$('.btn-chat-header').on('click', async () => await updateChatFriendsList());

/*
 * Update current user group list
 */
async function updateUserGroups() {
    userGroups = await getGroups(currentUser.id);
}


// ******************************************************************************************
// MAP INITIALISATION
// ******************************************************************************************
//var markersCluster = new L.MarkerClusterGroup();

var locateIcon = L.icon({
    iconUrl: '/static/img/locateIcon.png',

    iconSize:     [20, 20], // size of the icon
    shadowSize:   [0, 0], // size of the shadow
    iconAnchor:   [10, 10], // point of the icon which will correspond to marker's location
    shadowAnchor: [0, 0],  // the same for the shadow
    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
});

/**
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
**/

// Disable the zoom when user double click on the map
map.doubleClickZoom.disable();

/**
 * Add a marker to the map
 * @param type
 * @param msgID
 * @param latitude : latitude of the marker
 * @param longitude : longitude of the marker
 * @param content : content to be dispplay when marker pops up
 */
const addMarker = (msgID, latitude, longitude, content, type) => {
    var options = {
        "className" : "popup-msg",
    };
    markers[msgID] = new L.marker([latitude, longitude]).bindPopup(content, options);
    // Clean old markers before add new ones.
    //markersCluster.clearLayers();
    if (type === "msg") {
        msg_layer.addLayer(markers[msgID]).addTo(map);
    } else if (type === "area"){
        areas_layer.addLayer(markers[msgID]).addTo(map);
    }

    //markersCluster.addLayer(
    //    markers[msgID]
    //);
    return markers[msgID];
};


setInterval( async function() {
    if(isLocated)
        getMessage( userlat,userlon,defaultRadius, "msg" );
}, 60000);




// ******************************************************************************************
// GEOLOCATION
// ******************************************************************************************

/**
 * Try to find the location of the user oh the map and add a marker on it if it founds
 */
function geoloc(radius) {
    var geoSuccess = async function(position) {
        let startPos = position;
        userlat = startPos.coords.latitude;
        userlon = startPos.coords.longitude;
        map.setView([userlat, userlon], 100/Math.log(startPos.coords.accuracy));
        map.removeLayer(positionMarker);
        if (positionMarker !== undefined) {
              map.removeLayer(positionMarker);
              map.removeLayer(accuracyAreaZone);
              map.removeLayer(areaVisibilityMessage);
        }

        positionMarker = new L.marker([userlat, userlon], {icon:locateIcon}).bindPopup("You are next to here");
        accuracyAreaZone = L.circle([userlat, userlon], {radius: startPos.coords.accuracy, color:"#a3a5a6"});
        areaVisibilityMessage = L.circle([userlat, userlon], {radius: radius*1000, color:"#3e69d7"});

        map.addLayer(positionMarker);
        map.addLayer(accuracyAreaZone);
        map.addLayer(areaVisibilityMessage);

        // Get all message after geoloc
        await init(); // added because sometimes currentUser is undefined at the first loading
        getMessage( userlat,userlon,radius, "msg" );
        isLocated = true;

    };
    var geoFail = function(){
        console.log("User doesn't allow the app to locate him");
    };
    navigator.geolocation.getCurrentPosition(geoSuccess,geoFail);
}

L.easyButton('<span class="target">&target;</span>', function(btn, map){
    geoloc(defaultRadius);
}).addTo(map);

geoloc(defaultRadius);



// ******************************************************************************************
// CONTEXT MENU
// ******************************************************************************************

/**
 * Manage context menu
 */
let cursorLocation = undefined;
map.on('contextmenu', (e) => {
    cursorLocation = e.latlng;
    $.contextMenu({
        selector: '.context-menu-one',
        items: {
            message: {
                name: "Create new message",
                icon: "fa-envelope",
                className:"context-menu-custom", 
                callback: function() {
                    openMessageCreator( cursorLocation );
                }
            },
            sep1: "---------",
            area: {
                name: "Create new area", 
                icon: "fa-globe-europe",
                className:"context-menu-custom", 
                callback: function() {
                    openAreaPanelCreator( cursorLocation );
                }
            }
        }, 
        events: {
            show: function(opt) {
                var $this = this;
                $.contextMenu.setInputValues(opt, $this.data());
            }, 
            hide: function(opt) {
                var $this = this;
                $.contextMenu.getInputValues(opt, $this.data());
            }
        }
    });
});

// ******************************************************************************************
// FORMATTING FUNCTIONS
// ******************************************************************************************

/**
 * Format comments so they can be placed in a popup
 * @param message
 * @returns {string}
 */
function formatComments(msgID, comments){
    if (comments === undefined){
        return "";
    }
    return comments.map(x => {
        let editDOM = `<div class="comment-edit">
                            <a class="btn-comm-edit" href="#" data-comment-id="${x.id}" data-msg-id="${msgID}">
                                <i class="fas fa-edit"></i>
                            </a>
                            <a class="btn-comm-del" href="#" data-comment-id="${x.id}" data-msg-id="${msgID}">
                                <i class="fas fa-trash"></i>
                            </a>
                        </div>`
        let edit = x.sender.id == currentUser.id ? editDOM : "";
        return `
        <div class="comment-wrapper">
            <div class="comment-content">
                <span class="comment-sender"><b>${x.sender.name}</b></span>
                <p>${x.content}</p>
                <span class="comment-update-date">${x.updated_on}</span>`
                + edit + `
            </div>
        </div>
        `
    }).join(" ");
}

/**
 * Format a message so it can be placed in a popup
 * @param message
 * @returns {string}
 */
const formatMessage = async (msg) => {
    let sender = await getUserByID(msg.sender);
    let comments = await getComments(msg.id);
    let editDOM = `<div class="message-edit">
                            <a class="btn-msg-edit" href="#" data-msg-id="${msg.id}">
                                <i class="fas fa-edit"></i>
                            </a>
                            <a class="btn-msg-del" href="#" data-msg-id="${msg.id}">
                                <i class="fas fa-trash"></i>
                            </a>
                    </div>`
    let edit = msg.sender == currentUser.id ? editDOM : "";
    return `
        <div class="card text-center bg-light mb-3">
            <div class="card-header">
                <b>Message from :&nbsp;</b> ${sender.name}
            </div>
            <div class="card-body">
                <div class="msg-content">
                    <p>${msg.content}</p>`
                    + edit +
                `</div>
                <hr>
                <div class="comments-holder">
                ` +
                formatComments(msg.id, comments) + `
                </div>
                <div class="input-holder-comment">
                    <textarea class="comment-input" type="text" placeholder="Your comment ...""></textarea>
                </div>
                <button class="btn-pill btn-shadow btn-wide ml-auto btn btn-focus btn-sm btn-send-comment" type="button" data-msg-id="${msg.id}">Send</button>
            </div>
        <div>
        `
    ;
};

// ******************************************************************************************
// COMMENTS LISTENER
// ******************************************************************************************

/*
 * Update a popup by recreating it
 */
const updatePopup = async (msgID) => {
    let msg = await getMessageByID(msgID);
    let data = await formatMessage(msg);
    markers[msgID]._popup.setContent(data); 
}

/*
 * Post a comment and add it to the DOM
 */ 
$("body").on("click",".btn-send-comment", async function(){
    let msgID = $(this).attr("data-msg-id");
    let content = $(".comment-input").val();
    if(content.length > 0){
        let response = await postComment(msgID, content);
        if(response.status_code == 200){
            updatePopup(msgID);
        }
    }
    else{ showAlert("Your comment is empty !"); }
});

/*
 * Remove a comment
 */ 
$("body").on("click",".btn-comm-del", async function(){
    let msgID = $(this).attr("data-msg-id");
    let commentID = $(this).attr("data-comment-id");
    let response = await deleteComment(commentID);
    if(response.status_code == 200){
        updatePopup(msgID);
    }
});

/*
 * Edit a comment
 */ 
$("body").on("click",".btn-comm-edit", async function(){
    let commentID = $(this).attr("data-comment-id");
    let msgID = $(this).attr("data-msg-id");
    let comment = await getCommentByID(commentID);
    $(this).parents(".comment-content").html(`
                                            <textarea class="comment-edit-text" type="text"">${comment.content}</textarea>
                                            <button class="btn-pill btn-shadow btn-wide ml-auto btn btn-focus btn-sm btn-edit-ok-comment" type="button" data-comment-id="${commentID}" data-msg-id="${msgID}">Modify</button>
                                            <button class="btn-pill btn-shadow btn-wide ml-auto btn btn-focus btn-sm btn-edit-cancel" type="button" data-comment-id="${commentID}" data-msg-id="${msgID}">Cancel</button>
                                            `);
});

/*
 * Validate edit on a comment
 */ 
$("body").on("click",".btn-edit-ok-comment", async function(){
    let commentID = $(this).attr("data-comment-id");
    let msgID = $(this).attr("data-msg-id");
    let content = $(".comment-edit-text").val();
    if(content.length > 0){
        let response = await editComment(commentID, content);
        if(response.status_code == 200){
            updatePopup(msgID);
        }
    }
    else{ showAlert("Your comment is empty !"); }
});

/*
 * Cancel edit on a comment
 */
$("body").on("click", ".btn-edit-cancel", async function(){
    let msgID = $(this).attr("data-msg-id");
    updatePopup(msgID);
});

// ******************************************************************************************
// MESSAGE LISTENER
// ******************************************************************************************
/*
 * Edit a message
 */ 
$("body").on("click",".btn-msg-edit", async function(){
    console.log("Clicked");
    let msgID = $(this).attr("data-msg-id");
    let msg = await getMessageByID(msgID);
    $(this).parents(".msg-content").html(`
                                            <textarea class="msg-edit-text" type="text"">${msg.content}</textarea>
                                            <button class="btn-pill btn-shadow btn-wide ml-auto btn btn-focus btn-sm btn-edit-ok-msg" type="button" data-msg-id="${msgID}">Modify</button>
                                            <button class="btn-pill btn-shadow btn-wide ml-auto btn btn-focus btn-sm btn-edit-cancel" type="button" data-msg-id="${msgID}">Cancel</button>
                                            `);
});

/*
 * Validate edit on a message
 */ 
$("body").on("click",".btn-edit-ok-msg", async function(){
    let msgID = $(this).attr("data-msg-id");
    let content = $(".msg-edit-text").val();
    if(content.length > 0){
        let response = await editMessage(msgID, content);
        if(response.status_code == 200){
            updatePopup(msgID);
        }
    }
    else{ showAlert("Your message is empty !"); }
});

/*
 * Cancel edit on a message
 */
$("body").on("click", ".btn-edit-cancel-msg", async function(){
    let msgID = $(this).attr("data-msg-id");
    updatePopup(msgID);
});

/*
 * Remove a message
 */ 
$("body").on("click",".btn-msg-del", async function(){
    let msgID = $(this).attr("data-msg-id");
    let response = await deleteMessage(msgID);
    if(response.status_code == 200){
        map.removeLayer(markers[msgID]);
    }
});


// ******************************************************************************************
// MESSAGE CREATION
// ******************************************************************************************

/**
 * Show modal form for message creation
 */
let messageCreateContent = document.getElementById("message-panel").getElementsByClassName("cd-panel__content")[0];
map.on('dblclick', async function(e){
    openMessageCreator( e.latlng );
});

async function openMessageCreator( location ) {
    tinymce.remove();
    await updateUserGroups();

    let isOpen = togglePanel( undefined, "message-panel" );
    if(isOpen) {
        messageCreateContent.innerHTML = getHtmlContentCretateMessage( userGroups );
        msgPosition = location;
        addTinyMCE();
    } else {
        receivers = [];
    }
}



/**
 * Make API calls in function of receivers nubers in global variable "receivers"
 */
$(document).on('click', "#create-form-btn", function(e) {
    let content = $("#content").val();
    if( content.length > 0) {
        receivers.forEach( receiver => {
            let message = {
                "sender": currentUser.id,
                "receivers": parseInt(receiver),
                "latitude": msgPosition.lat,
                "longitude": msgPosition.lng,
                "radius": parseInt( $("#radius").val() ),
                "content": content,
                "visibility": parseInt( $('#message-visibility').val() ),
                "duration": String( $("#duration").val() * 3600 )
            };
            postMessage ( message );
        });
    }
    receivers = [];
    togglePanel( undefined, "message-panel" );

});

let receivers = []
$(document).on('change','#group-listing',function(){
    let groupID = parseInt( $("#group-listing").val() );
    let isAdded = receivers.some( id => id === groupID );
    if( groupID > 0 && !isAdded ) {
        receivers.push( groupID );
        let groupName = userGroups.find( group => group.id === groupID ).name;
        let group = `<button type="button" 
                             class="mb-2 mr-2 btn btn-info message-group-added"
                             style="margin-top:10px;"
                             data-groupid=${groupID}> 
                             ${groupName} 
                     </button> `;
        $('#message-group-list').append( group );
    }
});

$(document).on('click','.message-group-added',function(){
    let groupID = parseInt( $(this).attr("data-groupid") );
    receivers = receivers.filter( id => id !== groupID );
    $(this).remove();
    $("#group-listing").val(-1);
});

/**
 * Change the value of the radius slider
 */
$(document).on('input', '#radius', function() {
    let inputValue = $('#radius').val();
    $("label[for='radius']").text(inputValue);
});


/**
 * Change the value of the duration slider
 */
$(document).on('input', '#duration', function() {
    let inputValue = $('#duration').val()
    $("label[for='duration']").text(inputValue);
});

// ******************************************************************************************
// API CALLS
// ******************************************************************************************

/**
 * Send a POST to the API with the message and add marker on the map
 * @param message
 */
async function postMessage(data){
    let URL = 'message/create';
    let response = await postReq(URL, data);
    let msg = response.result;
    //getMessage(msg.latitude,msg.longitude,40, "msg");
      getMessage(userlat,userlon, defaultRadius, "msg");
    //geoloc(defaultRadius);
}

/**
 * Get all messages and add markers for a given position
 * @param lat
 * @param long
 * @param radius
 * @param type
 */
export async function getMessage(lat, long, radius, type){
    let URL = "message/list/" +lat+"/"+long+"/"+radius;
    let msg = await getReq(URL);
    let arrayMarkers = [];
    //if( type === "area" ) areas_layer.clearLayers();
    if( type === "msg" ) msg_layer.clearLayers();
    msg.forEach(async function(item) {
        let msgContent = await formatMessage(item);
        arrayMarkers.push(addMarker(item.id, item.latitude, item.longitude, msgContent, type));
    });

    return arrayMarkers;
}

/**
 * Get message by ID
 * @param msgID : Message ID
 */
function getMessageByID(msgID){
    let URL = "message/" + msgID + "/";
    return getReq(URL);
}

/**
 * Get comment by ID
 * @param commentID : Comment ID
 */
function getCommentByID(commentID){
    let URL = "comment/" + commentID + "/";
    return getReq(URL);
}

/**
 * Get all the comments associated to a message
 * @param msgID : Message id
 */
function getComments(msgID){
    let URL = "message/list/comments/" + msgID + "/";
    return getReq(URL);
}

/**
 * Create a new comment
 * @param id : Current user id
 * @param msgID : Message id
 * @param content : Message content
 */
function postComment(msgID, content){
    let URL = "comment/create/";
    let data =  {"sender": currentUser.id, "msg": msgID, "content": content};
    return postReq(URL, data);
}

/**
 * Delete a comment
 * @param commentID : The comment id
 */
function deleteComment(commentID){
    let URL = "comment/" + commentID + "/";
    return deleteReq(URL);
}

/**
 * Modify a comment
 * @param commentID : The comment id
 * @param content : Data to change
 */
function editComment(commentID, content){
    let URL = "comment/" + commentID + "/";
    let data = {"content": content};
    return patchReq(URL, data);
}

/**
 * Modify a message
 * @param msgID : The message id
 * @param content : Data to change
 */
function editMessage(msgID, content){
    let URL = "message/" + msgID + "/";
    let data = {"content": content};
    return patchReq(URL, data);
}

/**
 * Delete a messagr
 * @param msgID : The message id
 */
function deleteMessage(msgID){
    let URL = "message/" + msgID + "/";
    return deleteReq(URL);
}
