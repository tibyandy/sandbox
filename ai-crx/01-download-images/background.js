let refererRuleId = 1;
let currentReferer = null;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "SET_REFERER") {
    currentReferer = msg.referer;
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [refererRuleId],
      addRules: [{
        id: refererRuleId,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [
            { header: "Referer", operation: "set", value: msg.referer }
          ]
        },
        condition: { urlFilter: "*" }
      }]
    });
    sendResponse({ ok: true });
  }
  if (msg.type === "CLEAR_REFERER") {
    currentReferer = null;
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [refererRuleId]
    });
    sendResponse({ ok: true });
  }
});