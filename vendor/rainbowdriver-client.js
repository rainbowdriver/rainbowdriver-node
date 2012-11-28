/*globals Windows */
var rainbowDriver = rainbowDriver || {};

(function (argument) {
    "use strict";

    var connection,
        writer,
        tryAgain = true;

    function connect() {
        var host = rainbowDriver.host || "ws://localhost:8080",
            uri = new Windows.Foundation.Uri(host + '/browser_connection/websocket');

        tryAgain = false;
        connection = new Windows.Networking.Sockets.MessageWebSocket();
        connection.control.messageType = Windows.Networking.Sockets.SocketMessageType.utf8;

        connection.onclosed = closed;
        connection.onmessagereceived = receivedMessage;

        connection.connectAsync(uri).done(connected, connectionError);
    }

    function connected() {
        writer = new Windows.Storage.Streams.DataWriter(connection.outputStream);
        sendMessage('{ "status": "ready" }');
    }

    function connectionError(error) {
        console.log('Unable to connect: ', error);
        tryAgain = true;
    }

    function closed(error) {
        tryAgain = true;
        if (error) {
            console.log('Connection closed: ', error);
        }
        if (connection) {
            connection.close();
        }
        if (writer) {
            writer.close();
        }
        writer = null;
        connection = null;
    }

    function receivedMessage(message) {
        var dataReader,
            receivedString,
            receivedData = null;

        if (message.type == 'messagereceived' && message.getDataReader) {
            try {
                dataReader = message.getDataReader();
            } catch (e) {
                console.error('Error reading data');
                return closed();
            }
            receivedString = dataReader.readString(dataReader.unconsumedBufferLength);
            console.info("Message received: ", receivedString);
            try {
                receivedData = JSON.parse(receivedString);
            } catch (e) { }
        }

        if (receivedData) {
            executeCommand(receivedData);
        }
    }

    function executeCommand(data) {
        if (data &&
            'command' in data &&
            rainbowDriver.commands &&
            data.command in rainbowDriver.commands) {
                var result = rainbowDriver.commands[data.command](data);
                sendMessage(result);
            }
    }

    function sendMessage(message) {
        console.log("sending message: " + message);
        writer.writeString(message);
        writer.storeAsync().done("", sendError);
    }

    function sendError() {
        console.log('Error sending string, closing connection');
        closed();
    }

    rainbowDriver.connect = connect;
    rainbowDriver.sendMessage = sendMessage;

    setInterval(function reconnectTimer() {
        if (tryAgain) {
            connect();
        }
    }, 2 * 1000);

})();


var rainbowDriver = rainbowDriver || {};

(function () {
    "use strict";

    rainbowDriver.commands = {
        click: function clickElement(data) {
            var element = document.querySelector(data.selector),
                rect = element.getClientRects()[0],
                event;

            if (!element) {
                return false;
            }

            event = document.createEvent('MouseEvents');
            event.initMouseEvent('click', true, false, window, 1,
                (rect.left + element.clientWidth / 2),
                (rect.top + element.clientHeight / 2),
                (rect.left + element.clientWidth / 2),
                (rect.top + element.clientHeight / 2),
                false, false, false, false, /* keys */
                0, /* button */
                element);

            element.dispatchEvent(event);

            return true;
        },

        getTitle: function getTitle(data) {
            var response = JSON.stringify({
                name: 'getTitle',
                value: document.title
            });

            return response;
        },

        getValue: function getValue(data) {
            var element = document.querySelector(data.selector);

            if (!element) {
                return false;
            }

            var response = JSON.stringify({
                name: 'getElementText',
                value: element.textContent
            });

            return response;
        },

        getName: function getName(data) {
            var element = document.querySelector(data.selector);

            if (!element) {
                return false;
            }

            var response = JSON.stringify({
                name: 'getElementTagName',
                value: element.tagName
            });

            return response;
        },

        sendKeysToElement: function sendKeysToElement(data) {
            var element = document.querySelector(data.selector);

            if (!element) {
                return false;
            }

            element.value = data.value;

            var response = JSON.stringify({
                name: 'sendKeysToElement',
                status: 0,
                value: ""
            });

            return response;
        }
    };

})();
