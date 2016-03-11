var remote_app_info = null;
var remote_plugged = null;

// Check to see if hudl when the extension loads
$(document).ready(function () {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        if (tabs.length > 0) {
            update_is_hudl(tabs[0].url);
        }
    });
    tell_remote_app_about_extension();
    if (remote_plugged == null) {
        check_remote_app_running();
    }
});

// Check to see if hudl when tabs are updated
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    update_is_hudl(tab.url);
    tell_remote_app_about_extension();
    if (remote_plugged == null) {
        check_remote_app_running();
    }
});

// Check to see if hudl when tabs are activated (focused or pushed to background)
chrome.tabs.onActivated.addListener(function (listen) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        update_is_hudl(tabs[0].url);
    });
    tell_remote_app_about_extension();
    if (remote_plugged == null) {
        check_remote_app_running();
    }
});

// Check to see if hudl when window focuses change
chrome.windows.onFocusChanged.addListener(function (window_id) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        if (tabs.length > 0) {
            update_is_hudl(tabs[0].url);
        }
    });
    tell_remote_app_about_extension();
    if (remote_plugged == null) {
        check_remote_app_running();
    }
});

// Check to see if hudl and update the stored value
function update_is_hudl(url) {

    var is_hudl = is_page_hudl(url);

    chrome.storage.local.set({'is_hudl': is_hudl}, function () {
    });
}

function is_page_hudl(url) {
    var is_hudl = false;
    if (url.indexOf('hudl.com') != -1 && url.indexOf('pgb') != -1) {
        is_hudl = true;
    } else if (url.indexOf(chrome.extension.getURL('')) != -1) {
        is_hudl = chrome.storage.local.get('is_hudl');
    }
    return is_hudl
}

function tell_remote_app_about_extension() {
    chrome.management.getAll(function (result) {
        for (var j = 0; j < result.length; j++) {
            if (result[j]['name'] == 'Hudl USB Adapter') {
                remote_app_info = result[j];
                break
            }
        }

        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            if (tabs.length > 0 && is_page_hudl(tabs[0].url)) {
                chrome.runtime.sendMessage(remote_app_info['id'], {ext_id: chrome.runtime.id}, function (response) {
                    if (response.msg != "complete") {
                        console.log('For some reason our extension id sending failed. Sawry.');
                    } else {
                        console.log('ID send success.');
                    }
                });
            }
        });
    })
}

function check_remote_app_running() {
    if (remote_app_info != null) {
        chrome.runtime.sendMessage(remote_app_info['id'], {herro: 'is you there?'}, function (response) {
            if (typeof response.connection_id == "undefined") {
                chrome.management.launchApp(app['id'], function () {
                    console.log('Remote app not started. Starting and checking again in 3 sec.');
                    setTimeout(function () {
                        check_remote_app_running()
                    }, 3000);
                    chrome.storage.local.set({'remote_conn': false}, function () {
                    });
                });
            } else if (response.connection_id == null) {
                //console.log('Stored remote_conn as false.');
                chrome.storage.local.set({'remote_conn': false}, function () {
                });
            } else {
                //console.log('Stored remote_conn as true.');
                chrome.storage.local.set({'remote_conn': true}, function () {
                });
            }
        });
    } else {
        //console.log('No info about remote app. Requesting and checking again.');
        tell_remote_app_about_extension();
        setTimeout(function () {
            check_remote_app_running()
        }, 100);
    }
}

// Listens for messages from the remote app about what button was pressed
chrome.runtime.onMessageExternal.addListener(
    function (request, sender, sendResponse) {
        if (request.key_pressed) {
            var key_pressed = request.key_pressed;
            console.log('Tell injector script that you pressed:', key_pressed);
            // Send message to content script
            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                if (tabs.length > 0) {
                    chrome.tabs.sendMessage(tabs[0].id, {key_pressed: key_pressed}, function (response) {
                        // Put stuff here if we care about a response
                    });
                }
            });

            sendResponse({msg: "complete"});
        } else if (request.remote_conn == true || request.remote_conn == false) {
            if (request.remote_conn) {
                console.log('Remote plugged');
            } else {
                console.log('Remote unplugged');
            }
            remote_plugged = request.remote_conn;
            chrome.storage.local.set({'remote_conn': request.remote_conn}, function () {
            });
        }
    }
);