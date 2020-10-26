//import {getCurrentUser, getFriendsList, showAlert, getReq, postReq, patchReq} from './commun.js';

import {getCurrentUser, getFriendsList, showAlert, showSuccess, getHtmlFriendsList, getHtmlContentSeeFriend, getReq, postReq, patchReq} from './commun.js';
import {openChatBox} from './chat.js';


// ******************************************************************************************
// INIT 
// ******************************************************************************************

let currentUser = undefined;//JSON.parse(document.getElementById('current_user').textContent);
let userFriends = undefined;
let isOpenPanel = false;

/**
 * Get currentUser and update current user group list
 */
async function init() {
    currentUser = await getCurrentUser();
    await updateUserFriends();
} 
init();

/*
 * Update current user group list
 */
async function updateUserFriends() {
    userFriends = await getFriendsList(currentUser.id);
    //console.log( userFriends );
}

// ******************************************************************************************
// OPEN GROUP PANEL 
// ******************************************************************************************

// get open panel button, the header of panel and content of panel
let friendBtn = document.getElementById("friends-panel-btn");
let friendHeader = document.getElementById("friends-panel").getElementsByClassName("cd-panel__header")[0].getElementsByTagName("h3")[0];
let friendContent = document.getElementById("tab-friends");



/**
 * Click on btn open panel
 */
friendBtn.onclick = async function() {
    if( !isOpenPanel ) await updateUserFriends();
    isOpenPanel = togglePanel( friendBtn.id, "friends-panel" );
    if( isOpenPanel ) await initFriendsListener();
}


// ******************************************************************************************
// HTML CONTENT 
// ******************************************************************************************

/**
 * Returns html of a list of friends
 * @param {*} friends 
 */
function getHtmlInvitList( friends ) {
    let content = `
        <form class="form-inline d-flex justify-content-center md-form form-sm mt-0 panel-search">
            <i class="metismenu-icon pe-7s-search"></i> 
            <input class="form-control form-control-sm ml-3 w-75 search-input" type="text" placeholder="Search" aria-label="Search">
        </form>
        <ul class="list-group">`;
    let image = "/static/img/avatar.png";
    friends.forEach( frd => {
        if(frd.photo) image = frd.photo;
        content += `
            <div class="media position-relative btn-list-friend item-list search-item">
                <img src="${image}" alt="Smiley face" height="50" width="50">
                <div class="media-body item-list-name">
                    <h5 class="mt-0 search-match">${frd.name}</h5>
                </div>
                <div class="btn-group">
                    <button type="button" class="btn btn-dark item-btn-see" data-friendid="${frd.id}"> Show </button>
                    <button type="button" class="btn btn-dark item-btn-invit" data-friendid="${frd.id}"> Invite </button>                
                </div>
            </div>`
    });
    return content += "</ul>"
}



// ******************************************************************************************
// SEARCH FUNCTION 
// ******************************************************************************************

/**
 * Filters lists depending on a regex
 * Filter input needs to have "search-input" class
 * Item's block to hide need to have "search-item" class
 * Item's html for matching  need to have "search-match" class
 */
$(document).on("keyup", ".search-input", function() {
    let regex = new RegExp( $(this).val(), 'i' );
    $(".search-item").each( function() {
        let matchItem = $(this).find( $(".search-match") ).html();
        if( matchItem.search(regex) === -1 ) $(this).hide();
        else $(this).show();
    });
});



// ******************************************************************************************
// LISTENERS 
// ******************************************************************************************

/**
 * Listener => Fill initial right-side friends panel
 */ 
async function initFriendsListener() {

    await updateUserFriends()
    

    // fill initial group panel
    friendHeader.innerHTML = `Friends
                             <button id="friend-invit-btn" type="button" class="btn btn-light">Invit users</button>`;
    
    friendContent.innerHTML = getHtmlFriendsList( userFriends );

    // attach listener to add button friends
    let invitFriendBtn = document.getElementById("friend-invit-btn");
    invitFriendBtn.addEventListener( 'click', () => invitFriendListener() );

    // attach listener to all see friends button
    let seeFriendBtn = [...document.getElementsByClassName("btn-list-friend")];
    seeFriendBtn.forEach( btn => btn.addEventListener( 'click', () => seeFriendListener(btn) ));

    // attach listener to all see friends button
    let chatFriendBtn = [...document.getElementsByClassName("btn-chat-friend")];
    chatFriendBtn.forEach( btn => btn.addEventListener( 'click', () => {
        const friendid = btn.getAttribute("data-friendid");
        openChatBox(friendid);
    }));
}

/**
 * Listener => Fill fill friend details
 */ 
async function seeFriendListener(btn) {
    let friendID = parseInt( btn.getAttribute("data-friendid") );
    let friend = userFriends.find( frd => frd.id === friendID );

    friendHeader.innerHTML = `${friend.name}
                             <div class="btn-group">
                                 <button id="friend-delete" type="button" class="btn btn-light">Delete</button>
                                 <button id="friend-see-back" type="button" class="btn btn-light">Back</button>
                            </div>
                            `;

    let deleteBtn = document.getElementById("friend-delete");
    deleteBtn.addEventListener( 'click', () => deleteFriendListener( friend.id ) );        

    // fill content with group details
    friendContent.innerHTML = getHtmlContentSeeFriend( friend );

    // attach listener to back button
    let backBtn = document.getElementById("friend-see-back");
    backBtn.addEventListener( 'click', () => initFriendsListener() );
}


/**
 * Listener => Fill detail unknow user
 * Only back button differs from seeFriendListener(btn) - not quite beautiful :o
 * @param {*} btn 
 */
async function seeInvitFriendListener(btn) {
    let friendID = parseInt( btn.getAttribute("data-friendid") );
    let friend = await getReq( "user/"+friendID+"/" );

/*     friendHeader.innerHTML = `${friend.name}
                             <button id="friend-delete" type="button" class="btn btn-light">Delete</button>
                             <button id="friend-see-back" type="button" class="btn btn-light">Back</button>`; */

    friendHeader.innerHTML = `${friend.name}
                             <button id="friend-see-back" type="button" class="btn btn-light">Back</button>`;

/*     let deleteBtn = document.getElementById("friend-delete");
    deleteBtn.addEventListener( 'click', () => deleteFriendListener( friend.id ) );     */    

    // fill content with group details
    friendContent.innerHTML = getHtmlContentSeeFriend( friend );

    // attach listener to back button
    let backBtn = document.getElementById("friend-see-back");
    backBtn.addEventListener( 'click', () => invitFriendListener() );
}


/**
 * Listener => Remove a friend
 * @param {*} friendID 
 */
async function deleteFriendListener( friendID ) {
    let URL = 'user/friends/remove/' + currentUser.id;
    await patchReq( URL, {"friendList": friendID} );
    showAlert( "friend deleted" );
    await initFriendsListener();
}


/**
 * Listener =>  Fill detail invit list 
 */
async function invitFriendListener() {

    let friends = await getReq( "user/list/unknow_users/" + currentUser.id );
    //await getUnknowUsers();
    friendHeader.innerHTML = `Invit a friend
                             <button id="friend-join-back" type="button" class="btn btn-light">Back</button>`;

    //friendContent.innerHTML = getHtmlFriendsList( friends );
    friendContent.innerHTML = getHtmlInvitList( friends );

    // attach listener to see btn
    let seeFriendsBtn = [...document.getElementsByClassName("item-btn-see")];
    seeFriendsBtn.forEach( btn => btn.addEventListener( 'click', () => seeInvitFriendListener(btn) ));

    // attach listener to invit btn
    let invitFriendsBtn = [...document.getElementsByClassName("item-btn-invit")];
    invitFriendsBtn.forEach( btn => btn.addEventListener( 'click', () => invitOneFriendListener(btn) ));

    // attach listener to back button
    let backBtn = document.getElementById("friend-join-back");
    backBtn.addEventListener( 'click', () => initFriendsListener() );
}


/**
 * Listener => invit one friend
 * @param {*} btn 
 */
async function invitOneFriendListener(btn) {
    let friendID = parseInt( btn.getAttribute("data-friendid") );
    let URL = 'user/invite';
    await postReq( URL, {"to":friendID} );
    showSuccess( "Invitation sent" );
    await initFriendsListener();
}


// ******************************************************************************************
// API CALLS 
// ******************************************************************************************






