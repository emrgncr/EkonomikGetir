chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
    let url = tabs[0].url;
    document.getElementById("otzbir").innerHTML = url;
    // use `url` here inside the callback because it's asynchronous!
});