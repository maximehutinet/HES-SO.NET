import {getCurrentUser, showAlert, updateScroll, getReq, closeAllPanels, getUserByID} from './commun.js';


// ******************************************************************************************
// INIT 
// ******************************************************************************************

let currentUser = undefined;
let isWSConnected = false;
let URL = document.URL.split(":")[1].split("/main")[0];
if(URL == "//localhost"){
    URL = 'ws:' + URL + ':8001/ws/chat/';
}
else {
    URL = 'wss:' + URL + '/ws/chat/';
}
const chatSocket = new WebSocket(URL);
let chatBoxOpen = false;

/**
 * Get currentUser and update current user group list
 */
async function init() {
    currentUser = await getCurrentUser();
} 
init();

// ******************************************************************************************
// WEBSOCKET LISTENERS
// ******************************************************************************************
let timerID = 0;

function keepAlive() {
    let timeout = 20000;
    if (chatSocket.readyState === chatSocket.OPEN) {
        chatSocket.send('');
    }
    timerID = setTimeout(keepAlive, timeout);
}

function cancelKeepAlive() {
    if (timerID) {
        clearTimeout(timerID);
    }
}

chatSocket.onopen = () => {
    isWSConnected = true; 
    console.log("[WS] - Connected");
};

chatSocket.onmessage = async (e) => await onMessageReceived(e);

chatSocket.onerror = () => showAlert("Oups something went wrong");

chatSocket.onclose = (e) => {
    console.error('Chat socket closed unexpectedly');
};

// ******************************************************************************************
// WEBSOCKET HANDLERS
// ******************************************************************************************

async function onMessageReceived(e){
    const msg = JSON.parse(e.data).message;
    const sender = msg.sender;
    const recipient = msg.recipient;

    if(currentUser.id === sender.id || currentUser.id === recipient.id){
        if(!chatBoxOpen){
            await openChatBox(sender.id);
        }
        else{
            const msgHTML = formatMsg(msg);
            $(".msger-chat").append(msgHTML);
            updateScroll("msger-chat");
        }
        
    }
}

// ******************************************************************************************
// LISTENERS
// ******************************************************************************************

$(".msger-send-btn").on("click", () => onSendMessage());

var inputMsg = [...document.getElementsByClassName("msger-input")];
inputMsg.forEach( x => x.addEventListener("keyup", function(e) {
  if (e.keyCode === 13) {
    e.preventDefault();
    onSendMessage();
  }
}));

$(".btn-close-chat").on("click", () => hideChatBox());



// ******************************************************************************************
// HTML
// ******************************************************************************************

function formatMsg(msg){
    const msgClass = msg.sender.id == currentUser.id ? "right-msg" : "left-msg";

    return `
    <div class="msg ${msgClass}">
    <svg class="msg-img"><circle cx="25" cy="25" r="25" fill="#aeaeae" />
        <text x="45%" y="45%" text-anchor="middle" fill="white" font-size="20px" font-family="Arial" dy=".3em">${msg.sender.name.charAt(0).toUpperCase()}</text>
    </svg>
        <div class="msg-bubble">
            <div class="msg-info">
                <div class="msg-info-name">${msg.sender.name}</div>
                <div class="msg-info-time">${msg.created_on.split("-")[1]}</div>
            </div>
            <div class="msg-text">${msg.content}</div>
        </div>
    </div>
    `
}

// ******************************************************************************************
// WEBSOCKET FUNCTIONS
// ******************************************************************************************

function sendMsg(dst, content){
    chatSocket.send(JSON.stringify({
        'message': {
            "sender":currentUser.id,
            "recipient":dst,
            "content":content
        }
    }));
}

// ******************************************************************************************
// FUNCTIONS
// ******************************************************************************************

function emptyChatBox(){
    $(".msger-chat").html("");
}

export function hideChatBox(){
    $(".msg-chat-box").hide();
    emptyChatBox();
    chatBoxOpen = false;
}

async function updateChatName(dst){
    let user = await getUserByID(dst);
    $(".chat-name").html(user.name.toUpperCase());
}

export async function openChatBox(dst){
    emptyChatBox();
    await updateChatName(dst);
    $('#btn-send-chat').attr('data-friendid', dst); 
    await loadOldMessages(dst);
    $(".msg-chat-box").show();
    updateScroll("msger-chat");
    chatBoxOpen = true;
    closeAllPanels();
}

async function loadOldMessages(dst){
    const URL = "chat/list/message/" + dst + "/";
    let messages = await getReq(URL);
    messages.forEach(msg => { 
        $(".msger-chat").append(formatMsg(msg));
    });
}

function onSendMessage(){
    const msg = $(".msger-input").val();
    const dst = $('#btn-send-chat').attr('data-friendid');

    if(msg.length > 0 && isWSConnected) {
        sendMsg(dst, msg);
        $(".msger-input").val('');
    }
}