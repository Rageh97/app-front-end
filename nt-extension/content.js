// document.addEventListener('contextmenu', event => event.preventDefault());

document.addEventListener('keydown', function (event) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isLinux = navigator.platform.toUpperCase().indexOf('LINUX') >= 0;
    const isWindows = navigator.platform.toUpperCase().indexOf('WIN') >= 0;

    // Prevent DevTools opening on Mac
    if (
        (isMac && event.metaKey && event.altKey && event.key === 'I') ||
        (isMac && event.metaKey && event.altKey && event.key === 'J') ||
        (isMac && event.metaKey && event.altKey && event.key === 'C') ||
        (isMac && event.metaKey && event.shiftKey && event.key === 'C') ||
        (isMac && event.metaKey && event.shiftKey && event.key === 'M') ||
        (isMac && event.metaKey && event.key === 'U') ||
        (isMac && event.key === 'F12')
    ) {
        event.preventDefault();
    }

    // Prevent DevTools opening on Linux
    if (
        (isLinux && event.ctrlKey && event.shiftKey && event.key === 'I') ||
        (isLinux && event.ctrlKey && event.shiftKey && event.key === 'J') ||
        (isLinux && event.ctrlKey && event.shiftKey && event.key === 'C') ||
        (isLinux && event.ctrlKey && event.shiftKey && event.key === 'M') ||
        (isLinux && event.ctrlKey && event.key === 'U') ||
        (isLinux && event.key === 'F12')
    ) {
        event.preventDefault();
    }

    // Prevent DevTools opening on Windows
    if (
        (isWindows && event.ctrlKey && event.shiftKey && event.key === 'I') ||
        (isWindows && event.ctrlKey && event.shiftKey && event.key === 'J') ||
        (isWindows && event.ctrlKey && event.shiftKey && event.key === 'C') ||
        (isWindows && event.ctrlKey && event.shiftKey && event.key === 'M') ||
        (isWindows && event.ctrlKey && event.key === 'U') ||
        (isWindows && event.key === 'F12')
    ) {
        event.preventDefault();
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.type === "rme" && Array.isArray(message.index)) {
        let xx = message.index
        setInterval(() => {
            xx.forEach(x => {

                let element = null;
                if (!element)
                    element = document.evaluate(
                        x,
                        document,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    ).singleNodeValue;

                if (element) {
                    element.style.display = "none";
                    element.disabled = true;
                }

            });
        }, 20);
    }
    sendResponse({ status: "" });
});

window.addEventListener("message", (event) => {

    // Handle legacy messages
    if (event.data.type === "FROM_NT_APP") {
        chrome.runtime.sendMessage(event.data, (response) => {
            return
        });
    }

    // Handle new secure sync messages
    if (event.data.type === "INITIATE_SECURE_SYNC") {
        chrome.runtime.sendMessage(event.data, (response) => {
            return
        });
    }
})

setInterval(() => {
    window.postMessage({ type: 'FROM_EXTENSION', data: { m: 'Hello from the extension!', v: "1.0.0" } }, '*');
}, 70)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.greeting === "ls") {
        localStorage.setItem(message.data.name, message.data.value);
        sendResponse({ success: true });
    }
});