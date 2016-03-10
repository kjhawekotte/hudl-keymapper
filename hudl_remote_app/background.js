var button_maps = {
    '1001001111111110': "Tag",
    '1001001111111101': "FF",
    '1001001111111011': "Slow",
    '1001001111110111': "Next",
    '1001001111101111': "Rew",
    '1001001111011111': "Play",
    '1001001110111111': "Rev",
    '100100111111111': "Prev",
    '1001001011111111': "Full",
    '1001001111111111': "Key Up"
};

var connection_id = null;
var extension_id = null;

chrome.app.runtime.onLaunched.addListener(function () {
    get_serial(); // super serial
});

$(document).ready(function () {
    chrome.storage.local.get('extension_id', function (result) {
        extension_id = result.extension_id;
        if (extension_id == null || typeof extension_id == "undefined") {
            extension_id = null;
        }
    });

    get_serial(); // super serial

    setInterval(function () {
        watch_connection()
    }, 5000);
});

function watch_connection() {
    chrome.serial.getDevices(function (ports) {
        var port_str = '';
        for (var j = 0; j < ports.length; j++) {
            port_str += (ports[j]['path'].indexOf('tty.usb') != -1 ? ports[j]['path'] : '') + ' ';
            port_str += (ports[j]['displayName'] ? ports[j]['displayName'] : '') + ' '
        }

        if (port_str.indexOf('tty.usb') == -1 || port_str.indexOf('FT230X Basic UART') == -1) {
            chrome.runtime.sendMessage(extension_id, {remote_conn: false}, function (response) {
                // Do stuff here if we care...
            });
            get_serial();
        } else if (connection_id == null) {
            chrome.runtime.sendMessage(extension_id, {remote_conn: false}, function (response) {
                // Do stuff here if we care...
            });
            get_serial()
        }

    });
}

function get_serial() {
    chrome.serial.getDevices(function (ports) {
        var usb_port = null;

        for (var i = 0; i < ports.length; i++) {
            if (ports[i]['path'].indexOf('tty') != -1 && ports[i]['displayName'] == 'FT230X Basic UART') {
                usb_port = ports[i];
                break
            }
        }

        if (usb_port != null) {
            //console.log(usb_port);
            // bit rate == baud == 57600
            chrome.serial.connect(usb_port['path'], {name: "hudl_remote", bitrate: 57600}, function (conn_info) {
                console.log('CONNECTED... Maybe.');
                connection_id = conn_info['connectionId'];
                chrome.serial.flush(conn_info['connectionId'], function () {
                    console.log('Flushed.');
                    chrome.runtime.sendMessage(extension_id, {remote_conn: true}, function (response) {
                        // Do stuff here if we care...
                    });
                });
            });

        } else {
            console.log("Failed to find device. Trying again in 5 sec.");
            connection_id = null;
            //setTimeout(function () {
            //    get_serial()
            //}, 5000);
        }
    });
}

// Add a listener to find out when serial info is sent to computer
chrome.serial.onReceive.addListener(function (info) {
    // Make sure it came from the connected Hudl remote
    if (info['connectionId'] == connection_id && info.data) {
        var data = new Uint8Array(info.data);
        // Make sure we have all of the data (3-byte package so length should be 3)
        if (data.length == 3) {
            // Convert to binary string for identification
            var binary = '';
            for (var i = 0; i < data.length; i++) {
                binary += data[i].toString(2);
            }
            console.log(binary, '--', button_maps[binary]);

            var pressed_key = button_maps[binary];
            if (extension_id != null) {
                console.log('Telling the extension,', extension_id + ', that you pressed:', pressed_key);
                chrome.runtime.sendMessage(extension_id, {key_pressed: pressed_key}, function (response) {
                    if (response.msg != "complete") {
                        console.log('Failed to send button press to extension. Sawry. (Make sure you\'re in PGB');
                    } else {
                        console.log('Successfully sent message to extension.');
                    }
                });
            }
        }
    }
});

chrome.runtime.onMessageExternal.addListener(
    function (request, sender, sendResponse) {
        if (request.ext_id) {
            extension_id = request.ext_id;
            chrome.storage.local.set({'extension_id': extension_id}, function () {
            });
            sendResponse({msg: "complete"});
        } else if (request.herro) {
            sendResponse({connection_id: connection_id})
        }
    }
);

//"usb",
//    {
//      "usbDevices": [
//        {
//          "vendorId": 1027,
//          "productId": 24597
//        }
//      ]
//    }