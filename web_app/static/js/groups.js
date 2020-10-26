import {getCurrentUser, getGroups, showAlert, getReq, postReq, postReqFiles, deleteReq, patchReq, getHtmlFriendsList, getHtmlContentSeeFriend, getFriendsList, getHtmlInvitList, showSuccess} from './commun.js';


// ******************************************************************************************
// INIT 
// ******************************************************************************************

let currentUser = undefined;//JSON.parse(document.getElementById('current_user').textContent);
let userGroups = undefined;
var membersToDel = [];
var newAdmin = null;
let isOpenPanel = false;

/**
 * Get currentUser and update current user group list
 */
async function init() {
    currentUser = await getCurrentUser();
    await updateUserGroups();
} 
init();

/*
 * Update current user group list
 */
async function updateUserGroups() {
    userGroups = await getGroups(currentUser.id);
}

// ******************************************************************************************
// OPEN GROUP PANEL 
// ******************************************************************************************

// get open panel button, the header of panel and content of panel
let groupsBtn = document.getElementById("groups-panel-btn");
let groupHeader = document.getElementById("groups-panel").getElementsByClassName("cd-panel__header")[0].getElementsByTagName("h3")[0];
let groupContent = document.getElementById("tab-groups");


/**
 * Click on btn open panel
 */
groupsBtn.onclick = async function() {
    if( !isOpenPanel ) await updateUserGroups();
    isOpenPanel = togglePanel( groupsBtn.id, "groups-panel" ); 
    if( isOpenPanel ) await initGroupsListener();
}

/* groupsBtn.onclick = async function() {
    if( !isOpenPanel ) await initGroupsListener(); 
    isOpenPanel = togglePanel( groupsBtn.id, "groups-panel" ); 
} */
/* groupsBtn.onclick = async function() {
    let isOpen = togglePanel( groupsBtn.id, "groups-panel" );
    if(isOpen) await initGroupsListener();  
} */


/* if( !isOpenPanel ) await updateUserFriends();
isOpenPanel = togglePanel( friendBtn.id, "friends-panel" );
if( isOpenPanel ) await initFriendsListener(); */



// ******************************************************************************************
// HTML CONTENT 
// ******************************************************************************************

/**
 * Build a list of item. The list can be used with a search input.
 * @param {*} itemID : id of item 
 * @param {*} itemContent : content of item
 * @param {*} dataName : name of data variable (ex. data-groupid)
 * @param {*} itemPhoto : url of item's photo 
 * @param {*} defaultPhoto : default photo if item has no photo. Must be in static/img/
 */
function buildListItem( itemID, itemContent, dataName, itemPhoto, defaultPhoto ) {
    let content = `<ul class="list-group">`;
    let photo = "/static/img/" + defaultPhoto;
    if(itemPhoto) photo = itemPhoto;
    content += `
        <div class="media position-relative btn-list-group item-list item-list-click search-item" ${dataName}="${itemID}">
            <img src="${photo}" alt="Smiley face" height="50" width="50">
            <div class="media-body item-list-name">
                <h5 class="mt-0 search-match">${itemContent}</h5>
            </div>
        </div>`
    return content; 
}


/**
 * Returns html of a list of group
 * @param {*} groups 
 */
/* function getHtmlGroupList( groups ) {

    let content = `
        <form class="form-inline d-flex justify-content-center md-form form-sm mt-0 panel-search">
            <i class="metismenu-icon pe-7s-search"></i> 
            <input class="form-control form-control-sm ml-3 w-75 search-input" type="text" placeholder="Search" aria-label="Search">
        </form>
        <ul class="list-group">`;

    groups.forEach( grp => { 
        let visibility = "";
        if( grp.visibility === "Semi-Private" ) {
            visibility = `<i class="metismenu-icon pe-7s-lock"></i>`
        }
        if( grp.visibility === "Private" ) {
            visibility = `<i class="metismenu-icon pe-7s-shield"></i>`
        }
        content += buildListItem( grp.id, grp.name, "data-groupid", grp.photo, "avatar.png" ) })
    return content += "</ul>"
} */

function getHtmlGroupList( groups ) {

    let content = `
        <form class="form-inline d-flex justify-content-center md-form form-sm mt-0 panel-search">
            <i class="metismenu-icon pe-7s-search"></i> 
            <input class="form-control form-control-sm ml-3 w-75 search-input" type="text" placeholder="Search" aria-label="Search">
        </form>
        <ul class="list-group">`;

    groups.forEach( grp => { 
        let grpVisibility = getVisibilityName( grp.visibility );

        let htmlVisibility = "";
        if( grpVisibility === "Public") htmlVisibility = `<i class="align-center fa fa-lock-open" data-toggle="tooltip" title="Public"></i>`;
        if( grpVisibility === "Semi-Private" ) htmlVisibility = `<i class="fa fa-lock" data-toggle="tooltip" title="Semi-Private"></i>`;
        if( grpVisibility === "Private" ) htmlVisibility = `<i class="fa fa-user-lock" data-toggle="tooltip" title="Private"></i>`;

        let photo = "/static/img/avatar.png";
        if( grp.photo ) photo = grp.photo;

        content += `<div class="media position-relative btn-list-group item-list item-list-click search-item" data-groupid="${grp.id}">
                        <img src="${photo}" alt="Smiley face" height="50" width="50">
                        <div class="media-body item-list-name">
                            <h5 class="mt-0 search-match">
                                ${htmlVisibility} - ${grp.name}
                            </h5>
                        </div>
                    </div>`
    });


        //content += buildListItem( grp.id, grp.name, "data-groupid", grp.photo, "avatar.png" ) })
    return content += "</ul>"
}


/**
 * Returns html of a list of group to join
 * Add Request or join button dependong on group visibility
 * @param {*} groups 
 */
function getHtmlInvitGroupList( groups ) {
    let content = `
        <form class="form-inline d-flex justify-content-center md-form form-sm mt-0 panel-search">
            <i class="metismenu-icon pe-7s-search"></i> 
            <input class="form-control form-control-sm ml-3 w-75 search-input" type="text" placeholder="Search" aria-label="Search">
        </form>
        <ul class="list-group">`;

    groups.forEach( grp => { 

        let grpVisibility = getVisibilityName( grp.visibility );
        if( grpVisibility  === "Private" ) return; 

        let invit = `<button type="button" class="btn btn-dark item-btn-join" data-type="invit" data-groupid="${grp.id}"> Request </button>`;
        let locked = `<i class="fa fa-user-lock"></i>`;
        
        if( grpVisibility === "Public" ) {
            invit = `
                    <div class="btn-group">
                        <button type="button" class="btn btn-dark item-btn-see" data-groupid="${grp.id}"> See </button>
                        <button type="button" class="btn btn-dark item-btn-join" data-type="add" data-groupid="${grp.id}"> Join </button>
                    </div>
            `;
            locked = `<i class="fa fa-lock-open"></i>`;
        }

        let photo = "/static/img/" + "avatar.png";
        if(grp.photo) photo = grp.photo;

        content += `
            <div class="media position-relative btn-list-group item-list search-item" data-groupid="${grp.id}">
                <img src="${photo}" alt="Smiley face" height="50" width="50">
                <div class="media-body item-list-name">
                    <h5 class="mt-0 search-match">
                        ${locked} - ${grp.name}
                        
                    </h5>
                </div>
                ${invit}
            </div>
        `
    });
    return content += "</ul>"
}

/**
 * Returns html of add group form
 */
function getHtmlContentAddGroup() {
    return `
        <form id="createGroupForm" enctype="multipart/form-data">
            <div class="form-group">
                <label for="group-create-name">Group name</label>
                <input type="text" class="form-control" id="group-create-name" placeholder="name">
            </div>
            <div class="form-group">
                <label for="group-create-visibility">Visibility</label>
                <select class="form-control" id="group-create-visibility">
                <option value=1>Public</option>
                <option value=2>Semi-Private</option>
                <option value=3>Private</option>
                </select>
            </div>
            <div class="form-group">
                <label for="group-create-photo">Photo</label>
                <input type="file" class="form-control-file" id="group-create-photo">
            </div>
            <button id="group-create" type="button" class="btn btn-block btn-dark">Create</button>
        </form>`
}


/**
 * Returns html of see group details
 * @param {*} group 
 */
function getHtmlContentSeeGroup( group ) {

    let users = "";
    group.users.forEach( user => users += `<li class="list-group-item"> ${user.name} </li>`);

    let messages = "";
    group.messages.forEach( message => messages += `<li class="list-group-item"> ${message.sender} : ${message.content} </li>`);

    return `
    <ul class="nav nav-pills mb-3" id="pills-tab" role="tablist">
        <li class="nav-item">
            <a class="nav-link active" id="pills-messages-tab" data-toggle="pill" href="#pills-messages" role="tab" aria-controls="pills-messages" aria-selected="true">Messages</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="pills-members-tab" data-toggle="pill" href="#pills-members" role="tab" aria-controls="pills-members" aria-selected="false">Members</a>
        </li>
    </ul>
    <div class="tab-content" id="pills-tabContent">
    
        <div class="tab-pane fade show active" id="pills-messages" role="tabpanel" aria-labelledby="pills-messages-tab">
            <ul class="list-group">
            ${messages}
            </ul>
        </div>
    
        <div class="tab-pane fade" id="pills-members" role="tabpanel" aria-labelledby="pills-members-tab"> 
            <h4> Admin </h4>
            <ul class="list-group">
                <li class="list-group-item">${group.admin.name} </li>
            </ul>
            <h4> Membres </h4>
            <ul class="list-group">
                ${users}
            </ul>
            <p>
            <button id="group-see-invit" type="button" class="btn btn-block btn-dark" data-group-id="${group.id}">Invite users</button>            
            </p>
        </div>
    </div>
    `
}


/**
 * Returns html of of unregister public group details
 * @param {*} group 
 */
function getHtmlContentInvitSeeGroup( group ) {

    let users = "";
    group.users.forEach( user => users += `<li class="list-group-item"> ${user.name} </li>`);

    let messages = "";
    group.messages.forEach( message => messages += `<li class="list-group-item"> ${message.sender} : ${message.content} </li>`)

    return `
    <ul class="nav nav-pills mb-3" id="pills-tab" role="tablist">
        <li class="nav-item">
            <a class="nav-link active" id="pills-messages-tab" data-toggle="pill" href="#pills-messages" role="tab" aria-controls="pills-messages" aria-selected="true">Messages</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="pills-members-tab" data-toggle="pill" href="#pills-members" role="tab" aria-controls="pills-members" aria-selected="false">Members</a>
        </li>
    </ul>
    <div class="tab-content" id="pills-tabContent">
    
        <div class="tab-pane fade show active" id="pills-messages" role="tabpanel" aria-labelledby="pills-messages-tab">
            <ul class="list-group">
            ${messages}
            </ul>
        </div>
    
        <div class="tab-pane fade" id="pills-members" role="tabpanel" aria-labelledby="pills-members-tab"> 
            <h4> Admin </h4>
            <ul class="list-group">
                <li class="list-group-item">${group.admin.name} </li>
            </ul>
            <h4> Membres </h4>
            <ul class="list-group">
                ${users}
            </ul>
        </div>
    </div>
    `
}


/**
 * Returns html of see group details
 * @param {*} group 
 */
function getHtmlContentSeeGroupEdit( group ) {

    let users = "";
    group.users.forEach( user => {
                    users += `<li class="list-group-item"> ${user.name} 
                    <a class="btn-grp-mem-del" href="#" data-member-id="${user.id}">
                        <i class="fas fa-trash"></i>
                    </a>
                    <a class="btn-grp-new-admin" href="#" style="display:none" data-member-id="${user.id}">
                        <i class="far fa-check-square"></i>
                    </a>
                    </li>`
                });

    let messages = "";
    group.messages.forEach( message => messages += `<li class="list-group-item"> ${message.sender} : ${message.content} </li>`)

    return `
    <ul class="nav nav-pills mb-3" id="pills-tab" role="tablist">
        <li class="nav-item">
            <a class="nav-link" id="pills-messages-tab" data-toggle="pill" href="#pills-messages" role="tab" aria-controls="pills-messages" aria-selected="false">Messages</a>
        </li>
        <li class="nav-item">
            <a class="nav-link active" id="pills-members-tab" data-toggle="pill" href="#pills-members" role="tab" aria-controls="pills-members" aria-selected="true">Members</a>
        </li>
    </ul>
    <div class="tab-content" id="pills-tabContent">
    
        <div class="tab-pane fade" id="pills-messages" role="tabpanel" aria-labelledby="pills-messages-tab">
            <ul class="list-group">
            ${messages}
            </ul>
        </div>
    
        <div class="tab-pane fade show active" id="pills-members" role="tabpanel" aria-labelledby="pills-members-tab"> 
            <h4> Admin </h4>
            <ul class="list-group">
                <li class="list-group-item">${group.admin.name} 
                    <a class="btn-grp-admin-del" href="#" data-member-id="${group.admin.id}">
                        <i class="fas fa-trash"></i>
                    </a>
                </li>
            </ul>
            <h4> Membres </h4>
            <ul class="list-group">
                ${users}
            </ul>
        </div>

        <button id="btn-group-delete" type="button" class="btn btn-block btn-danger" data-group-id="${group.id}">Delete group</button>
    </div>
    `
}


/**
 * Get all details of a group (admin name, unser name, messages sender and content, ...)
 * @param {*} groupID 
 * TODO : add a route to get Visibility
 */
async function getGroupDetails( groupID ) {
    let groupRaw = await getOneGroup( groupID );
    let messagesRaw = await getGroupMessages( groupID );
    let id = groupID;
    let name = groupRaw.name;
    let visibility = groupRaw.visibility;
    let users = await getGroupMembers( groupID );
    let admin = users.find( user => user.id == groupRaw.admin );
    let messages = messagesRaw.flatMap( message => {
        let sender = users.find( user => user.id == message.sender );
        if( !sender ) return [];
        return { id:message.id, sender:sender.name, content:message.content };
    });
    return { id:id, name:name, visibility:visibility, admin:admin, users:users, messages:messages };
}

function getVisibilityName( id ) {
    if( id === 1 ) return "Public";
    if( id === 2 ) return "Semi-Private";
    if( id === 3 ) return "Private";
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


function removeTabViewClasses() {
    $('#tab-grp-view').removeClass( 'active' );
    $('#tab-groups').removeClass( 'active' );
    $('#tab-groups-add').removeClass( 'active' );
    $('#tab-grp-add').removeClass( 'active' );
}
/**
 * Display Area panel corresponding to panType value
 * @param {*} panType : "list" or "add"
 */
function switchGroupPanel( panType ) {

    if( panType === "list" ) {
        removeTabViewClasses();
        $('#tab-grp-view').addClass( 'active' );
        $('#tab-groups').addClass( 'active' );
    }
    if( panType === "add" ) {
        removeTabViewClasses();
        $('#tab-grp-add').addClass( 'active' );
        $('#tab-groups-add').addClass( 'active' );
    }
}

/**
 * Listener => Fill initial right-side group panel
 */ 
async function initGroupsListener() {
    await updateUserGroups()

    switchGroupPanel( "list" );

    // fill initial group panel
    groupHeader.innerHTML = `Groups
                             <button id="group-join-btn2" type="button" class="btn btn-light">Join</button>`;
    
    groupContent.innerHTML = getHtmlGroupList( userGroups );


    // attach listener to join group button
    let joinGroupBtn = document.getElementById("group-join-btn2");
    joinGroupBtn.addEventListener( 'click', () => joinGroupListener() );

    // attach listener to add button group
/*     let addGroupBtn = document.getElementById("group-add-btn");
    addGroupBtn.addEventListener( 'click', () => addGroupListener() ); */


    // attach listener to all see group button
    let seeGroupsBtn = [...document.getElementsByClassName("btn-list-group")];
    seeGroupsBtn.forEach( btn => btn.addEventListener( 'click', () => seeGroupListener(btn) ))
}


/**
 * Listener => Fill right-side panel with group details
 * @param {*} btn 
 */
async function seeGroupListener(btn) {
    let groupID = btn.getAttribute("data-groupid");
    let group = await getGroupDetails( groupID );
    let groupMembers = await getGroupMembers(groupID);
    let groupSize = groupMembers.length


    // fill header with name, visibility, back button. 
    // if currentUser is admin : add edit button and attach listener
    if( currentUser.id === group.admin.id ) {
        groupHeader.innerHTML = `${group.name}
                                <button id="group-admin-edit" type="button" class="btn btn-light">Edit</button>
                                <button id="group-see-back" type="button" class="btn btn-light" data-groupid="${groupID}">Back</button>
                                <button id="btn-group-leave" type="button" class="btn btn-danger" data-group-id="${groupID}">Leave group</button>`;
        let editBtn = document.getElementById("group-admin-edit");
        editBtn.addEventListener( 'click', () => editGroupListener(group, btn) );        
    } else {
        groupHeader.innerHTML = `${group.name}
                                <button id="group-see-back" type="button" class="btn btn-light">Back</button>
                                <button id="btn-group-leave" type="button" class="btn btn-danger" data-group-id="${groupID}">Leave group</button>`;
    }

    // fill content with group details
    groupContent.innerHTML = getHtmlContentSeeGroup(group);

    // attach listener to back button
    let backBtn = document.getElementById("group-see-back");
    backBtn.addEventListener( 'click', () => initGroupsListener() );


    let invitBtn =  document.getElementById("group-see-invit");
    invitBtn.addEventListener( 'click', () => invitMembersListener(btn) );

    // attach listener to leave button
    let leaveGroupBtn = document.getElementById("btn-group-leave");
    leaveGroupBtn.addEventListener( 'click', async () => {
                                    if(currentUser.id === group.admin.id && groupSize > 1){
                                        showAlert("You must select a new Admin before leaving the group");
                                    }
                                    else if(currentUser.id === group.admin.id && groupSize === 1){
                                        showAlert("You are the last member, you must delete the group");
                                    }
                                    else{
                                        await removeMembersFromGroup(groupID, currentUser.id);
                                        await initGroupsListener();
                                    }});

    // attach listener add members button
    let addMembersBtn = document.getElementById("group-see-invit");
    addMembersBtn.addEventListener( 'click', async () => {
                                                    let friendsList = await getFriendsList(currentUser.id);
                                                    $("#grp-add-members").html(getHtmlFriendsList(friendsList));
                                                    });
}


/**
 * Display list of unknown users to invit
 * @param {*} btn 
 */
async function invitMembersListener(btn) {
    let groupID = btn.getAttribute("data-groupid");
    let users = await getReq( "group/list/unknow_users/" + groupID );

    groupHeader.innerHTML = `Invit users
                             <button id="group-see-back" type="button" data-groupid="${groupID}" class="btn btn-light">Back</button>`;
    
    groupContent.innerHTML = getHtmlInvitList(users);

    // attach listener to back button
    let backBtn = document.getElementById("group-see-back");
    backBtn.addEventListener( 'click', () => seeGroupListener(backBtn) );

    // attach listener to see btn
    let seeFriendsBtn = [...document.getElementsByClassName("item-btn-see")];
    seeFriendsBtn.forEach( btnSeee => btnSeee.addEventListener( 'click', () => seeInvitFriendListener(btnSeee, btn) ));

    // attach listener to invit btn
    let invitFriendsBtn = [...document.getElementsByClassName("item-btn-invit")];
    invitFriendsBtn.forEach( btnUser => btnUser.addEventListener( 'click', () => invitOneMember(btnUser, btn) ))
}

async function invitOneMember( btnUser, btnGroup ) {
    let userID = parseInt( btnUser.getAttribute("data-friendid") ); 
    let groupID = parseInt( btnGroup.getAttribute("data-groupid") ); 
    let URL = 'group/invite'
    await postReq( URL, {"to":userID, "group":groupID} );
    showSuccess("Invitation sent");
    await seeGroupListener(btnGroup);
}


/**
 * Listener => display list of unkow users from the current group
 * @param {*} btnSee : btn of user displayed
 * @param {*} btnBack : btn to back to users unknown list
 */
async function seeInvitFriendListener(btnSee, btnBack) {
    let friendID = parseInt( btnSee.getAttribute("data-friendid") );
    let friend = await getReq( "user/"+friendID+"/" );

    groupHeader.innerHTML = `${friend.name}
                             <button id="friend-see-back" type="button" class="btn btn-light">Back</button>`;
   
    // fill content with group details
    groupContent.innerHTML = getHtmlContentSeeFriend( friend );

    // attach listener to back button
    let backBtn = document.getElementById("friend-see-back");
    console.log( btnBack )
    backBtn.addEventListener( 'click', () => invitMembersListener(btnBack) );
}



/**
 * Listener => Fill right-side panel with unknow group details
 * @param {*} btn 
 */
async function seeInvitGroupListener(btn) {
    let groupID = btn.getAttribute("data-groupid");
    let group = await getGroupDetails( groupID );


    groupHeader.innerHTML = `${group.name}
                            <button id="group-see-back" type="button" class="btn btn-light">Back</button>`;


    // fill content with group details
    groupContent.innerHTML = getHtmlContentInvitSeeGroup(group);

    // attach listener to back button
    let backBtn = document.getElementById("group-see-back");
    backBtn.addEventListener( 'click', () => joinGroupListener() );
}


/**
 * Listener => Fill right-side panel with list of public groups joinable 
 */
async function joinGroupListener() {
    let groups = await getReq( 'group/list' );
    
    //await getPublicGroups();
    let userGroupsID = userGroups.map( userGroup => userGroup.id );

    let otherGroups = groups.filter( group => !userGroupsID.includes(group.id) );

    groupHeader.innerHTML = `Join a group
                            <button id="group-join-back" type="button" class="btn btn-light">Back</button>`;
                            console.log( "join");
    groupContent.innerHTML = getHtmlInvitGroupList( otherGroups );

    // attach listener to all group button
    let joinGroupsBtn = [...document.getElementsByClassName("item-btn-join")];
    joinGroupsBtn.forEach( btn => btn.addEventListener( 'click', () => joinOneGroupListener(btn) ));

    // attach listener to all group button
    let seeGroupsBtn = [...document.getElementsByClassName("item-btn-see")];
    seeGroupsBtn.forEach( btn => btn.addEventListener( 'click', () => seeInvitGroupListener(btn) ));

    // attach listener to back button
    let backBtn = document.getElementById("group-join-back");
    backBtn.addEventListener( 'click', () => initGroupsListener() );
}


/**
 * Listener => Make api call to add or invit a user in a group depending on data-type
 * 
 * @param btn : btn used to call the listener
 */
async function joinOneGroupListener(btn) {
    let type = btn.getAttribute("data-type");
    let groupID = btn.getAttribute("data-groupid");

    if( type === "add") {
        let URL = 'group/members/add/' + groupID;
        await patchReq( URL, {"users": currentUser.id} );
        showSuccess("Group added");
    }

    if( type === "invit" ) {
        let URL = 'group/join';
        await postReq( URL, {"group":groupID} );
        showSuccess("Request sent");
    }

    
    await initGroupsListener()
}

/**
 * Listener => Fill right-side panel with group details to edit
 * @param {*} group
 */
async function editGroupListener(group, btn) {
    groupHeader.innerHTML = `<input id="group-edit-name-field" type="text" maxlength="15" value="${group.name}">
                            <button id="group-edit-cancel" type="button" class="btn btn-light">Cancel</button>
                            <button id="group-admin-apply-edit" type="button" class="btn-pill btn-shadow btn-wide ml-auto btn btn-focus btn-sm">Apply</button>`;

    // fill content with group details
    groupContent.innerHTML = getHtmlContentSeeGroupEdit(group);

    let groupMembers = await getGroupMembers(group.id);
    let groupSize = groupMembers.length

    let delAdminBtn = [...document.getElementsByClassName("btn-grp-admin-del")];
    delAdminBtn.forEach( btn => btn.addEventListener( 'click', async () => {
                                let memberID = btn.getAttribute("data-member-id");
                                if(memberID == group.admin.id) {
                                    if(groupSize > 1) {
                                        showAlert("You must select a new Admin");
                                        $(".btn-grp-mem-del").hide();
                                        $(".btn-grp-new-admin").show();

                                    }
                                    else{
                                        await deleteGroup(group.id);
                                        await initGroupsListener();
                                    }
                                }
                                }));


    let delMemberBtn = [...document.getElementsByClassName("btn-grp-mem-del")];
    delMemberBtn.forEach( btn => btn.addEventListener( 'click', async () => {
                                                    let memberID = btn.getAttribute("data-member-id");
                                                    if(!membersToDel.includes(memberID) && memberID != group.admin.id){
                                                        membersToDel.push(memberID); 
                                                        groupSize -= 1;
                                                        // Remove member from the DOM
                                                        $(".btn-grp-mem-del[data-member-id=" + memberID + "]").parents(".list-group-item").remove();
                                                    }
                                                    if(memberID == group.admin.id){
                                                        if(groupSize > 1) {
                                                            showAlert("You must select a new Admin before leaving the group");
                                                            $(".btn-grp-mem-del").hide();
                                                            $(".btn-grp-new-admin").show();
                                                        }
                                                        else{
                                                            await deleteGroup(group.id);
                                                            await initGroupsListener();
                                                        }
                                                    }
                                                    }
                                                    ));
    // attach listener for the select new admin button                                                    
    let newAdminBtn = [...document.getElementsByClassName("btn-grp-new-admin")];
    newAdminBtn.forEach( btn => btn.addEventListener( 'click', async () => {
                                                    let memberID = btn.getAttribute("data-member-id");
                                                    let memberHTML = $(".btn-grp-mem-del[data-member-id=" + memberID + "]").parents(".list-group-item").html();
                                                    newAdmin = memberID;
                                                    $(".btn-grp-admin-del[data-member-id=" + group.admin.id + "]").parents(".list-group-item").replaceWith(
                                                        `<li class="list-group-item">` +
                                                        memberHTML + `</li>`
                                                    );
                                                    $(".btn-grp-mem-del").show();
                                                    $(".btn-grp-new-admin").hide();
                                                    }));

    // attach listener to delete button
    let delGroupBtn = document.getElementById("btn-group-delete");
    delGroupBtn.addEventListener( 'click', async () => {
                                                await deleteGroup(group.id);
                                                userGroups = userGroups.filter(x => x.id != group.id);
                                                await initGroupsListener();
                                                });


    // attach listener to cancel edit button
    let cancelBtn = document.getElementById("group-edit-cancel");
    cancelBtn.addEventListener( 'click', async () => {
/*                                                 groupHeader.innerHTML = `${group.name} (${group.visibility})
                                                <button id="group-admin-edit" type="button" class="btn btn-light">Edit</button>
                                                <button id="group-see-back" type="button" class="btn btn-light">Back</button>`;
                                                groupContent.innerHTML = getHtmlContentSeeGroup(group); 
                                                let editBtn = document.getElementById("group-admin-edit");
                                                editBtn.addEventListener( 'click', async () => await editGroupListener(group) ); 
                                                let backBtn = document.getElementById("group-see-back");
                                                backBtn.addEventListener( 'click', async () => await initGroupsListener() ); */
                                                membersToDel = [];
                                                await seeGroupListener( btn );
                                                
                                            });

    // attach listener to apply button
    let applyBtn = document.getElementById("group-admin-apply-edit");
    applyBtn.addEventListener( 'click', async () => {
                                                let newGroupName = $("#group-edit-name-field").val();
                                                if(newGroupName != group.name){
                                                    await updateGroup(group.id, {"name" : newGroupName});
                                                }
                                                membersToDel.forEach(async (x) => await removeMembersFromGroup(group.id, x));
                                                membersToDel = []
                                                if(newAdmin != null){
                                                    await updateGroup(group.id, {"admin" : newAdmin})
                                                    newAdmin = null;
                                                }
                                                await initGroupsListener();
                                            });
}






/**
 * Listener => Fill right-side panel with creation form group 
 */
async function addGroupListener() {

    groupContent.innerHTML = getHtmlContentAddGroup();

    groupHeader.innerHTML = `Add a group
                            <button id="group-add-back" type="button" class="btn btn-light">Back</button>`;

    // attach listener to create button
    let createBtn = document.getElementById("group-create");
    createBtn.addEventListener( 'click', () => createGroupListener() );


    // attach listener to back button
    let backBtn = document.getElementById("group-add-back");
    backBtn.addEventListener( 'click', () => initGroupsListener() );
}

/**
 * Listener => Make api call to create a group
 * TODO : show alert if group name already exists
 */
async function createGroupListener() {
    let data = {};
    let name = document.getElementById("group-create-name").value;
    if( !name ) return;
    data.name = name;
    data.admin = currentUser.id;
    let visibility = document.getElementById("group-create-visibility").value;
    data.visibility = visibility;
    let photo = document.getElementById("group-create-photo").value;
    if( photo ) data.photo = photo;
    await createGroup( data );
    await initGroupsListener();
}

// ******************************************************************************************
// API CALLS 
// ******************************************************************************************


/**
 * Get information about a specific group
 * @param groupID
 */
function getOneGroup(groupID){
    let URL = "/group/" + groupID;
    return getReq(URL);
}

/**
 * Get list of group messages
 * @param groupID
 */
function getGroupMessages(groupID){
    let URL = 'group/list/messages/' + groupID;
    return getReq(URL);
}

/**
 * Get list of group members
 * @param groupID
 */
function getGroupMembers(groupID){
    let URL = 'user/list/group/' + groupID;
    return getReq(URL);
}

/**
 * Get all public groups (temporary)
 */
function getPublicGroups(){
    let URL = "/group/list/public";
    return getReq(URL);
}

/**
 * Update a group
 * @param {*} groupID 
 * @param {*} userID 
 */
function updateGroup(groupID, data) {
    let URL = 'group/' + groupID;
    return patchReq(URL, data);
}

/**
 * Delete a group
 * @param {*} groupID 
 */
function deleteGroup(groupID) {
    let URL = 'group/' + groupID;
    return deleteReq(URL);
}

/**
 * Add an User to a group
 * @param {*} groupID 
 * @param {*} userID 
 */
function addUserToGroup(groupID, userID) {
    let URL = 'group/members/add/' + groupID;
    let data = {"users": userID};
    return patchReq(URL, data);
}

/**
 * Remove users from group
 * @param {*} groupID 
 * @param {*} listMembers
 */
function removeMembersFromGroup(groupID, listMembers) {
    let URL = 'group/members/remove/' + groupID;
    let data = {"users": listMembers};
    return patchReq(URL, data);
}

/**
 * Create a group
 * @param data: name, admin, visibility, [photo]
 */
function createGroup(data){
    let URL = 'group/create';
    return postReqFiles(URL, data);
}

// ******************************************************************************************
// OLD, KEEP FOR RE-USE
// ******************************************************************************************

/**
 * Fill group list of bottom icon
 */
function fillGroupIconList() {
    let listGroups = "";
    userGroups.forEach(group => { listGroups += formatGroup(group)});
    $("#btn-group").attr('data-content', listGroups);
}

/**
 * Fill group list of message
 */
function fillGroupMessageList() {
    let $el = $("#group-listing");
    $el.empty(); // remove old options
    userGroups.forEach(function(item){
        $el.append($("<option></option>").attr("value", item.id).text(item.name));
    });
}

/**
 * Return gourp info of a user group
 * @param {*} groupID 
 */
function getInfoUserGroup( groupID ) {
    return userGroups.find( group => group.id == groupID );
}

//[ CALLS ] -------------------------------------------------------------------------------------
$('#create_group_form').submit(function(event){
    event.preventDefault();
    console.log("Create Group is working!"); // sanity check
    let name = $('#id_name').val();
    let visibility =  $('#id_visibility').val();
    let photo = $('#id_photo').val();

    // Sanitizer fields
    if (name === "") name = undefined;
    if (visibility === "") visibility = undefined;
    if (photo === "") photo = undefined;
    //let form_data = $("#profile-update").serialize();
    let form_dom = $('#create_group_form');
    let form_data = new FormData(form_dom.closest('form').get(0));
    // Start Ajax call
    $.ajax({
        url : "/group/create_bis/", // the endpoint
        //url : "/main", // the endpoint
        type : "POST", // http method
        headers: getCookie('application/x-www-form-urlencoded; charset=UTF-8'),
        enctype: 'multipart/form-data',
        data: form_data, // data sent with the post request
        processData: false,
        contentType: false,
        // handle a successful response
        params: {
                'csrf_token': getCookie('application/x-www-form-urlencoded; charset=UTF-8'),
                'csrf_name': 'csrfmiddlewaretoken',
                'csrf_xname': 'X-CSRFToken',
                },
        success : async function(json) {
            if (json.success ){
                $('#id_name').val(''); // remove the value from the input
                $('#id_visibility').val(''); // remove the value from the input
                $('#id_photo').val(''); // remove the value from the input

                console.log(json); // log the returned json to the console
                console.log("success"); // another sanity check
/*                 $('#result_create_group').html(
                    "<div class=\"alert alert-success alert-dismissible fade show\" role=\"alert\">" +
                    "Success! Your group has been updated."+
                    "  <button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\">" +
                    "    <span aria-hidden=\"true\">&times;</span>" +
                    "  </button>" +
                    "</div>"
                );  */
                await initGroupsListener();
                showSuccess( "Success! Your group has been created." );
            }
        },

        // handle a non-successful response
        error : async function(xhr,errmsg,err) {
            //await initGroupsListener();
            showAlert( "Oops! We have encountered an error: " + errmsg );
            /* $('#result_create_group').html(
            "<div class=\"alert alert-danger alert-dismissible fade show\" role=\"alert\">" +
            "Oops! We have encountered an error: "+errmsg+
            "  <button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\">" +
            "    <span aria-hidden=\"true\">&times;</span>" +
            "  </button>" +
            "</div>"); // provide a bit more info about the error to the console */
        }
    });
});

/**
 * Return list of users not contain in a group
 * @param {*} groupID 
 */
function getUnknowUserListFromGroup(groupID){
    let URL = 'group/list/unknow_users/' + groupID;
    let axiosConfig = {
      headers: getAccessHeaders("application/json")
    };

    axios.get(URL, axiosConfig)
    .then((res) => {
      console.log("RESPONSE RECEIVED: ", res.data);
      return res.data;
    })
    .catch((err) => {
      console.log("AXIOS ERROR: ", err);
      showAlert( "Bad request !" );
    });
}

/**
 * Add (or remove if present) a user to a group
 * @param {*} groupID 
 * @param {*} userList 
 */
function addRemoveUsersFromGroup(groupID, userID) {
    let URL = 'group/members/' + groupID;

    var postData = {"users": userID};

    let axiosConfig = {
      headers: getCsrfAccessHeaders('application/x-www-form-urlencoded; charset=UTF-8')
    };

    axios.post(URL, postData, axiosConfig)
    .then((res) => {
      console.log("RESPONSE RECEIVED: ", res);
      return res.data;
    })
    .catch((err) => {
      console.log("AXIOS ERROR: ", err);
    });
}



/**
 * Modify a group
 * @param {*} groupID 
 * @param {*} userList 
 */
function patchGroup(groupID, data) {
    let URL = 'group/' + groupID;

    var postData = data;

    let axiosConfig = {
      headers: getCsrfAccessHeaders('application/x-www-form-urlencoded; charset=UTF-8')
    };

    axios.post(URL, postData, axiosConfig)
    .then((res) => {
      console.log("RESPONSE RECEIVED: ", res);
      return res.data;
    })
    .catch((err) => {
      console.log("AXIOS ERROR: ", err);
    });
}

/**
 * Join a group
 * @param groupID
 */
function joinGroup(userID, groupID){
    let URL = 'group/members/' + groupID;
    var postData = {'users': userID};

    let axiosConfig = {
      headers: getCsrfAccessHeaders('application/x-www-form-urlencoded; charset=UTF-8')
    };

    axios.post(URL, postData, axiosConfig)
    .then((res) => {
      console.log("RESPONSE RECEIVED: ", res.data);
      return res.data;
    })
    .catch((err) => {
      console.log("AXIOS ERROR: ", err);
    });
}

//[ FORMATS ] --------------------------------------------------------------------------------------------------


/**
 * Format a group
 * @param group 
 */
const formatGroup = (group) => {
    return `
    <div class="card text-center group-card">
        <h5 class="card-header">${group.name}</h5>
        <div class="card-body">
            <a href="#" id="group-see-group-btn" class="btn-small" data-groupid="${group.id}">See group</a>
        </div>
    </div>
    `
};

/**
 * Format a group for join modalq
 * @param group 
 */
const formatJoinGroup = (group) => {
    return `
    <div class="card text-center group-card">
        <h5 class="card-header">${group.name}</h5>
        <div class="card-body">
            <a href="#" id="group-join-group-btn" class="btn-small" data-groupid="${group.id}">Join group</a>
        </div>
    </div>
    `
};

/**
 * Format a member
 * @param member 
 */
const formatMember = (member) => {
    return `
        <div class="card group-card">
            <div data-userid="${member.id}" class="card-body member-item">
                <p>${member.name}</p>
            </div>
        </div>
    `
};

/**
 * Format the group messages
 * @param messages
 * @returns {string}
 */
const formatGroupMessage = (message) => {
    return `
        <div class="card group-card">
            <div class="card-header">
                <b>From : </b>${message.sender}
            </div>
            <div class="card-body">
                <p>${message.content}</p>
            </div>
        </div>
    `
};

/**
 * format the users list for invitation 
 * @param {*} groupID 
 * @param {*} userList 
 */
function formatInvitUserList(groupID, userList) {
    let $el = $("#search-invit-content");
    $el.attr("data-usergroup", groupID);
    $el.empty();
    userList.forEach( function(user){   
        $el.append(`
            <button class="list-group-item list-group-item-action item-user-invit-list" 
            data-userid="${user.id}">${user.name}</button>
        `);
    });
}

//[ GROUP ] -------------------------------------------------------------------------------

/**
 * Fill the group modal with info about the group
 * @param group 
 */
async function fillGroupModal(groupID){

    $('.group-icon-edit').hide();
    $("#group-form-edit-name").hide();
    $("#group-form-edit-visibility").hide();

    let groupInfo = await getOneGroup(groupID);
    let groupMembers = await getGroupMembers(groupID);
    let groupMembersFormatted = groupMembers.reduce((out, x) => out += formatMember(x), "");
    let groupAdmin = groupMembers.find(user => user.id == groupInfo.admin);
    let groupAdminFormatted = formatMember(groupAdmin);

    if( groupAdmin.id == currentUser.id ) $("#group-edit").show();
    else $("#group-edit").hide();
    
    $("#group-name").html(groupInfo.name);
    $("#group-visibility").html(`<span>${groupInfo.visibility}</span>`);
    $("#group-admin").html(groupAdminFormatted);
    $("#group-members").html(groupMembersFormatted);
    $('#group-invit-user-btn').attr("data-groupid",groupID);
    $('#group-leave').attr("data-groupid",groupID);

    $('#group-edit').attr("data-groupid",groupID);
    $('#group-input-name').val(groupInfo.name);
    $('#group-edit-name-valid-btn').attr("data-groupid",groupID);
    $('#group-edit-name-reset-btn').attr("data-groupid",groupID);

    $('#group-input-visibility').val( visibilityToID(groupInfo.visibility) );
    $('#group-edit-visibility-valid-btn').attr("data-groupid",groupID);
    $('#group-edit-visibility-reset-btn').attr("data-groupid",groupID);

    let groupMessages = await getGroupMessages(groupID);
    let groupMessagesFormatted = groupMessages.reduce((out, x) => out += formatGroupMessage(x), "");

    $("#group-messages").html(groupMessagesFormatted);
}


/**
 * Active group edition mode
 * @param {*} groupID 
 */
function activeEditGroup(groupID) {
    let admin = (getInfoUserGroup(groupID)).admin;

    $('.group-icon-edit').toggle();

    if(!$('#group-admin').find('.member-item').hasClass('edited')) {
        $('#group-admin').find('.member-item').append(`<button type="button" class="btn btn-primary btn-sm change-admin">Change</button>`);
        $('#group-admin').find('.member-item').addClass('edited');
    } else {
        $('#group-admin').find('.btn').remove();
        $('#group-admin').find('.member-item').removeClass('edited');
    }

    $('#group-members').find('.member-item').each( function() {
        let userID = $(this).attr("data-userid");
        
        if( parseInt(userID) !== admin ) {
            if( !$(this).hasClass("edited") ) {
                $(this).append(`<button type="button" data-groupid=${groupID} data-userid="${userID}" class="btn btn-danger btn-sm remove-user">Remove</button>`);
                $(this).addClass('edited');
            } else {
                $(this).find('.btn').remove();
                $(this).removeClass("edited");
            }
        }
    });

}

/**
 * On click : show group edition mode
 */
$(document).on('click', "#group-edit", function(e) {
    let groupID = String(e.target.getAttribute('data-groupid'));
    activeEditGroup(groupID);
});

/**
 * On click : show user selection for admin modification
 */
$(document).on('click', ".change-admin", function(e) {
    $('#group-members').find('.member-item').each( function() {
        if($(this).find(".btn").hasClass("remove-user")) {
            $(this).find(".btn").text("Select");
            $(this).find(".btn").removeClass("remove-user btn-danger");
            $(this).find(".btn").addClass("select-admin btn-success");
        } else {
            $(this).find(".btn").text("Remove");
            $(this).find(".btn").addClass("remove-user btn-danger");
            $(this).find(".btn").removeClass("select-admin btn-success");
        }
    });
});

/**
 * On click : apply admin modification
 */
$(document).on('click', ".select-admin", async function(e) {
    let groupID = String(e.target.getAttribute('data-groupid'));
    let userID = String(e.target.getAttribute('data-userid'));
    await patchGroup(groupID, {admin:userID});
    await updateUserGroups();
    fillGroupModal(groupID);
});


/**
 * On click : remove user of the group 
 */
$(document).on('click', ".remove-user", async function(e) {
    let groupID = String(e.target.getAttribute('data-groupid'));
    let userID = String(e.target.getAttribute('data-userid'));
    await addRemoveUsersFromGroup(groupID, userID);
    await updateUserGroups();
    await fillGroupModal(groupID);
    activeEditGroup(groupID);
});




// NAME MODIFICATIONS -------------------------

/**
 * Active name modification on group modal
 */
$(document).on('click', "#group-icon-edit-name", function() {
    $("#group-name").hide();
    $('.group-icon-edit').hide();
    $('#group-edit').attr('disabled', 'disabled');
    $("#group-form-edit-name").show()
    $("#group-input-name").focus();
});


/**
 * Check and send new name
 */
$(document).on('click', "#group-edit-name-valid-btn", async function(e) {
    let groupID = String(e.target.getAttribute('data-groupid'));
    let groupInfo = getInfoUserGroup(groupID);
    let value = $("#group-input-name").val();
    let validNewName = false;

    if( value !== "" && value !== groupInfo.name ) {
        await patchGroup(groupID, {name: value}).then( 
            data => { validNewName = true;
                      $("#group-name").html(value);
                      updateUserGroups(); },
            error => { showGroupAlert("Name already exists") } 
        );
    }

    if(!validNewName) {
        $("#group-input-name").val(groupInfo.name);
    }
    $("#group-form-edit-name").hide();
    $('.group-icon-edit').show();
    $('#group-edit').removeAttr("disabled");
    $("#group-name").show();
});

/**
 * Reset name modifications
 */
$(document).on('click', "#group-edit-name-reset-btn", async function(e) {
    let groupID = String(e.target.getAttribute('data-groupid'));
    let groupInfo = getInfoUserGroup(groupID);
    $("#group-input-name").val(groupInfo.name);
    $("#group-form-edit-name").hide();
    $('.group-icon-edit').show();
    $('#group-edit').removeAttr("disabled");
    $("#group-name").show();
});

// VISIBILITY MODIFICATIONS -------------------------

/**
 * Active visibility modification on group modal
 */
$(document).on('click', "#group-icon-edit-visibility", function() {
    $("#group-visibility").hide();
    $('.group-icon-edit').hide();
    $('#group-edit').attr('disabled', 'disabled');
    $("#group-form-edit-visibility").show()
});

/**
 * Check and send new visibility
 */
$(document).on('click', "#group-edit-visibility-valid-btn", async function(e) {
    let groupID = String(e.target.getAttribute('data-groupid'));
    let groupInfo = getInfoUserGroup(groupID);
    let value = $("#group-input-visibility").val();
    let groupVisibility = visibilityToID(groupInfo.visibility);

    if( value !== groupVisibility ) {
        await patchGroup(groupID, {visibility: value}).then( 
            data => { $("#group-visibility").html( IDToVisibility(value) );
                      updateUserGroups();}
        );
    }

    $("#group-form-edit-visibility").hide();
    $('.group-icon-edit').show();
    $('#group-edit').removeAttr("disabled");
    $("#group-visibility").show();
});

/**
 * Reset visibility modifications
 */
$(document).on('click', "#group-edit-visibility-reset-btn", async function(e) {
    let groupID = String(e.target.getAttribute('data-groupid'));
    let groupInfo = getInfoUserGroup(groupID);
    $('#group-input-visibility').val( visibilityToID(groupInfo.visibility) );
    $("#group-form-edit-visibility").hide();
    $('.group-icon-edit').show();
    $('#group-edit').removeAttr("disabled");
    $("#group-visibility").show();
});

/**
 * Convert visibility name in ID
 * @param {*} visibility 
 */
function visibilityToID(visibility) {
    switch(visibility) {
        case "Public": return 1;
        case "Semi-Private": return 2;
        default: return 3
    }
}

/**
 * Coonvert visibility ID in name
 * @param {*} ID 
 */
function IDToVisibility(ID) {
    switch(ID) {
        case "1": return "Public";
        case "2": return "Semi-Private";
        default: return "Private"
    }
}


/**
 * Leave a group is normal user or last member
 */
$(document).on('click', "#group-leave", async function(e){
    let groupID = String(e.target.getAttribute('data-groupid'));
    let currentGroup = getInfoUserGroup( groupID );
    let adminID = currentGroup.admin;
    let groupSize = currentGroup.users.length;
    
    let validExit = (currentUser.id != adminID) || (groupSize == 1)

    if(currentUser.id != adminID)
        await addRemoveUsersFromGroup(groupID, currentUser.id);

    if(groupSize == 1)
        await deleteGroup(groupID);

    if(validExit) {
        updateUserGroups(currentUser.id);
        $("#modal-see-group").modal('hide'); 
    } else {
        showGroupAlert("You must select a new Admin before leaving group")
    }

});

/*
 * Show group modal on click and hide popover
 */
$(document).on('click', "#group-see-group-btn", function(e){
    let groupID = String(e.target.getAttribute('data-groupid'));
    fillGroupModal(groupID);
    $("#modal-see-group").modal('show');
    $("[data-toggle=popover]").popover('hide');
});


/*
 * Join group 
 */
$(document).on('click', "#group-join-group-btn", async function(e){
    let userID = currentUser.id;
    let groupID = String( e.target.getAttribute('data-groupid'));
    let response = await joinGroup(userID, groupID)
    $("#modal-join-group").modal('hide');
    //updateUserGroups(userID);
});


/*
 * Refresh the user group list on click
 */
$(document).on('click', "#btn-group", function() {
    updateUserGroups(currentUser.id);
});

/**
 * Show create group modal on click + and hide popover
 */
$(document).on("click", ".add-group-btn", () => {
    $(".adminNewGroup #adminName").text(currentUser.name);
    $(".membresNewGroup #adminName").text(currentUser.name);
    $("#modal-post-group").modal('show');
    $("[data-toggle=popover]").popover('hide');
});

/**
 * Show join group list modal on click + and hide popover
 */
$(document).on("click", ".join-group-btn", async function() {
    let publicGroups = await getPublicGroups();
    let listPublicGroups = "";
    publicGroups.forEach((publicGroup) => {
        listPublicGroups += formatJoinGroup(publicGroup)
    });
    $("#modal-join-group").find(".modal-body").html(listPublicGroups);
    $("#modal-join-group").modal('show');
    $("[data-toggle=popover]").popover('hide');
});

/**
 * Create group on form submit 
 */
$("#create_group").submit( () => {
    if($("#nameOfGroup input").val().length > 0) {
        createGroup(
            $("#nameOfGroup input").val(), 
            currentUser.id, 
            $("#create_group #visibility").val()
            );
            $("#modal-post-group").modal('hide');
            $("#create_group")[0].reset();
    }
});

/**
 * Display invit user modal
 */
$(document).on('click', "#group-invit-user-btn", async function(e){
    let groupID = String(e.target.getAttribute('data-groupid'));
    userList = await getUnknowUserListFromGroup(groupID);
    formatInvitUserList(groupID, userList);
    $("#modal-see-group").modal('hide');
    $("#modal-invit-user").modal('show');
});


/**
 * On click : select a user to invit
 */
$(document).on('click', ".item-user-invit-list", function(){
    $(this).toggleClass("active");  
});

/**
 * On click : add invit users to the current group
 */
$(document).on('click', "#invit-users-btn", async function(){
    let userList = [];
    let groupID = $("#search-invit-content").attr("data-usergroup");
    $('#search-invit-content').children().each( function() {
        if( $(this).hasClass('active') )
            userList.push( $(this).attr("data-userid") );
    });
    userList.forEach( async function(user) {
        await addRemoveUsersFromGroup(groupID, parseInt(user));
    });   
    await updateUserGroups();
    await fillGroupModal(groupID);
    $("#modal-invit-user").modal('hide');
    $("#modal-see-group").modal('show'); 
});


/*
 [ Utils ] -------------------------------------------------------------------------------------
 */

/**
 * Function used to filter dropdown search
 */
function filterUserFunction() {
    var input, filter, buttons, i;
    input = document.getElementById("user_search");
    filter = input.value.toUpperCase();
    div = document.getElementById("search-invit-content");
    buttons = div.getElementsByTagName("button");
    for (i = 0; i < buttons.length; i++) {
        txtValue = buttons[i].textContent || buttons[i].innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            buttons[i].style.display = "";
        } else {
            buttons[i].style.display = "none";
        }
    }
}

function showGroupAlert(message){
    $("#group-modal-body").prepend(
        `
        <div id="alert-err" class="alert alert-danger alert-dismissible fade show" role="alert">
            <span class="alert-body">${message}</span>
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
        `
    );
    $("#group-modal-body .alert").first().delay(1000).fadeOut(1000, function () { $(this).remove(); });
}
