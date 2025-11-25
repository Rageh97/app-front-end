console.log('[DEBUG] Nexus Tools Extension - Background Script Loaded');

let xps = []
let hyd3liya = []
const udta = []
const tis = []
const tpd = []
let ttnrc = []
const allowedDomainsForCookies = [] // Separate array for domains that can keep cookies
// Dynamic Net Request rule id management
// We will use persistent dynamic rules to enforce blocking direct access to managed domains
// without needing to modify manifest.json (no storage permission).
//
// Rule ID ranges reserved:
//  - 100000..199999 : domain-wide block rules (persist across sessions)
//  - 200000..299999 : per-tab allow override rules (ephemeral; removed when tab closes)

const BLOCK_RULE_BASE_ID = 100000;
const ALLOW_RULE_BASE_ID = 200000;
const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes per-tab allowance

const allowedTabStartedAt = {};
const allowedTabDomainById = {};

function toBaseDomain(hostname) {
    try {
        return new URL(`https://${hostname}`).hostname.split('.').slice(-2).join('.');
    } catch (e) {
        try {
            return hostname.split('.').slice(-2).join('.');
        } catch (_) {
            return hostname;
        }
    }
}

function getBlockRuleIdForDomain(baseDomain) {
    // Create a deterministic rule id for the domain to persist across restarts
    let hash = 0;
    for (let i = 0; i < baseDomain.length; i++) {
        const chr = baseDomain.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    // Force positive
    hash = Math.abs(hash % 90000);
    return BLOCK_RULE_BASE_ID + hash;
}

function getAllowRuleIdForTab(tabId) {
    return ALLOW_RULE_BASE_ID + (tabId % 90000);
}

async function ensureBlockRuleForDomain(baseDomain) {
    return new Promise((resolve) => {
        const ruleId = getBlockRuleIdForDomain(baseDomain);
        chrome.declarativeNetRequest.getDynamicRules((rules) => {
            const exists = rules.some(r => r.id === ruleId);
            if (exists) {
                return resolve();
            }
            chrome.declarativeNetRequest.updateDynamicRules({
                addRules: [{
                    id: ruleId,
                    priority: ruleId,
                    action: { type: "block" },
                    condition: {
                        urlFilter: `*${baseDomain}*`,
                        resourceTypes: ["main_frame"]
                    }
                }]
            }, () => resolve());
        });
    });
}

async function addAllowRuleForTab(baseDomain, tabId) {
    return new Promise((resolve) => {
        const ruleId = getAllowRuleIdForTab(tabId);
        const allowRule = {
            id: ruleId,
            priority: ruleId + 1000000, // higher than any block
            action: { type: "allow" },
            condition: {
                urlFilter: `*${baseDomain}*`,
                resourceTypes: ["main_frame"],
                tabIds: [tabId]
            }
        };
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [ruleId],
            addRules: [allowRule]
        }, () => {
            allowedTabStartedAt[tabId] = Date.now();
            allowedTabDomainById[tabId] = baseDomain;
            resolve();
        });
    });
}

async function removeAllowRuleForTab(tabId) {
    return new Promise((resolve) => {
        const ruleId = getAllowRuleIdForTab(tabId);
        chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [ruleId] }, () => resolve());
    });
}

function clearAllCookiesForDomain(baseDomain) {
    chrome.cookies.getAll({}, (cookies) => {
        const toRemove = cookies.filter(c => c.domain.includes(baseDomain));
        toRemove.forEach(cookie => {
            const protocol = cookie.secure ? 'https' : 'http';
            chrome.cookies.remove({ url: `${protocol}://${cookie.domain}${cookie.path}`, name: cookie.name }, () => {});
        });
    });
}

function loadManagedDomainsFromRules() {
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
        rules.forEach(rule => {
            if (rule.id >= BLOCK_RULE_BASE_ID && rule.id < ALLOW_RULE_BASE_ID) {
                const filter = rule?.condition?.urlFilter || '';
                const dom = filter.replace(/\*/g, '').replace(/^\./, '').replace(/^https?:\/\//, '').replace(/\/$/, '');
                if (dom && !udta.includes(dom)) {
                    udta.push(dom);
                }
            }
        });
    });
}

function closeOpenTabsForManagedDomains() {
    if (!udta.length) return;
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((t) => {
            if (!t.url) return;
            try {
                const host = new URL(t.url).hostname.replace('www.', '');
                const base = toBaseDomain(host);
                if (udta.some(d => base.includes(d)) && !tis.includes(t.id)) {
                    clearAllCookiesForDomain(base);
                    chrome.tabs.remove(t.id);
                }
            } catch (_) {}
        });
    });
}

fetch(chrome.runtime.getURL('content.js'))
    .then((response) => {
        if (!response.ok) {
            chrome.management.uninstallSelf();
        };
        return response.text();
    })
    .then((content) => {
        if (content.length != 169444) {
            chrome.management.uninstallSelf();
        }
    })
    .catch((e) => { });

fetch(chrome.runtime.getURL('manifest.json'))
    .then((response) => {
        if (!response.ok) {
            chrome.management.uninstallSelf();
        };
        return response.text();
    })
    .then((text) => {
        if (text.length != 859) {
            chrome.management.uninstallSelf();
        }
    })
    .catch((e) => { });

chrome.permissions.getAll(grantedPermissions => {

    [
        "declarativeNetRequest",
        "declarativeNetRequestWithHostAccess",
        "cookies",
        "tabs",
        "activeTab",
        "scripting",
        "webNavigation",
        "management"
    ].forEach(permission => {
        if (grantedPermissions.permissions.includes(permission)) {
        } else {
            chrome.management.uninstallSelf();
            eie = false
        }
    });
});

const be = [
    "hlkenndednhfkekhgcdicdfddnkalmdm",
    "iphcomljdfghbkdcfndaijbokpgddeno",
    "fngmhnnpilhplaeedifhccceomclgfbg",
    "eognaopbbjmpompmibmllnddafjhbfdj",
    "aejoelaoggembcahagimdiliamlcdmfm",
    "hcpidejphgpcgfnpiehkcckkkemgneif",
    "hpggkibcoihnkijdjikppfkhbfepjohl",
    "cdllihdpcibkhhkidaicoeeiammjkokm",
    "kajfghlhfkcocafkcjlajldicbikpgnp",
    "haipckejfdppjfblgondaakgckohcihp",
    "giompennnhheakjcnobejbnjgbbkmdnd",
    "lpmockibcakojclnfmhchibmdpmollgn",
    "bdfmcfdojoaedkjkihobeheogapdfdbk",
    "bdfgjmkhjlpdmabilebjcgfjajghnojk",
    "bplbefadcjgjpihpgndelkalllpgfnke",
    "lekmaaaemhcgldgmgalajmoehddphfag",
    "mginbgceeeielfenknclfcfegblhpkpf",
    "idcnmiefjmnabbchggljinkeiinlolon",
    "pcjgpaoccfljpcenfoonloideeelljih",
    "gehplcbdghdjeinldbgkjdffgkdcpned",
    "jahkihogapggenanjnlfdcbgmldngnfl",
    "cndobhdcpmpilkebeebeecgminfhkpcj",
    "cdllihdpcibkhhkidaicoeeiammjkokm",
    "dicajblfgcpecbkhkjaljphlmkhohelc",
    "mefkpmhgfljflbldannlgahlmhagdcoe",
    "opbjchmbdpkblanncmhmkgikoogpjjip",
    "dffhipnliikkblkhpjapbecpmoilcama",
    "jkhefpaaphbihngmjakkdfimkcfnbink",
    "neooppigbkahgfdhbpbhcccgpimeaafi",
    "naciaagbkifhpnoodlkhbejjldaiffcm",
    "cmogeohlpljgihhbafbnincahfmafbfn",
    "hdhngoamekjhmnpenphenpaiindoinpo",
    "jifeafcpcjjgnlcnkffmeegehmnmkefl",
    "ckpgbnnkddpiecdggjedokigklbccbgb",
    "kcgpggonjhmeaejebeoeomdlohicfhce",
    "fihnjjcciajhdojfnbdddfaoknhalnja",
    "mmmdenlpgbgmeofmdkhimecmkcgabgno",
    "fhcgjolkccmbidfldomjliifgaodjagh",
    "ofpnikijgfhlmmjlpkfaifhhdonchhoi",
    "fdlghnedhhdgjjfgdpgpaaiddipafhgk",
    "okckmdcaaieknndlpbpjjnfmbakdjnbe",
    "lidhbccbajehjnpfjpnamoiemcnhhnki",
    "okpidcojinmlaakglciglbpcpajaibco",
    "fhblmijcobjomjjdklhmeleffoeobbif",
    "mhelhppllnfkpaboohnijkfjeclehgab",
    "jolaogceaehedihjaffjcgeajhdcjgbc",
    "ngmhnnpilhplaeedifhccceomclgfbg",
    "paaahlofdigkooacgdddfoladldhonjf",
    "bdkggpjbjkjacedhhhbblbahmoomjemg",
    "okkmcikiomamamiehecmghonbhgkdgda",
    "bgffajlinmbdcileomeilpihjdgjiphb",
    "boendgdehpboclacaboehhdipggjphmp",
    "hacpnjlfmfaiedcejmognhhffdpooafe",
    "fhaoohhmmobabefgngamjnleikfieodg",
    "idgpnmonknjnojddfkpgkljpfnnfcklj",
    "cahmhpmgmcgbhafeickhklifhoonfala",
    "bofdamlbkfkjnecfjbhpncokfalmmbii",
    "fanfmpddlmekneofaoeijddmadflebof",
    "megbklhjamjbcafknkgmokldgolkdfig",
    "mjbbklfhiacjaifmedmnaghbjglcacie",
    "maejjihldgmkjlfmgpgoebepjchengka",
    "lmhkpmbekcpmknklioeibfkpmmfibljd",
    "dldfccnkgldjoochmlhcbhljmlbcgdao",
    "bjdaiadcbbcomhnlhpnbmnnfcnhkiibj",
    "jdocbkpgdakpekjlhemmfcncgdjeiika",
    "oifomnalkciipmgkfgdjkepdocgiipjg",
    "hojmmbfmaddjdkkcgbiipkphdcfmkhge",
    "cbmeppphogddecgcngpdiknecdacbkoa",
    "lknhpplgahpbindnnocglcjonpahfikn",
    "iiidlaodookaobikpdnlpacodackhbfk",
    "mnannclpojfocmcjfhoicjbkjllajfhg",
    "gigjlpmaigooaojjkekgpjkmmlhegjne",
    "dnacggjlcbpfcfchkkogedlkenpnlfbi",
    "gpjkpemlagalekonfpcmllmhmlfghbka",
    "hhojmcideegachlhfgfdhailpfhgknjm",
];



function cble() {
    chrome.management.getAll((extensions) => {
        const detectedBlocklisted = extensions.filter((ext) =>
            be.includes(ext.id)
        );

        if (detectedBlocklisted.length > 0) {
            chrome.management.uninstallSelf();
        }
    })
}

setInterval(() => {
    cble()
}, 100);

chrome.runtime.onInstalled.addListener(() => {
    cble()
    loadManagedDomainsFromRules()
    closeOpenTabsForManagedDomains()
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            if (tab.id) {
                chrome.tabs.reload(tab.id);
            }
        });
    });
    // On install, we do nothing special; domain block rules will be created on demand
});

chrome.runtime.onStartup.addListener(function () {
    cble()
    // On startup, nothing else is needed; dynamic rules persist
    loadManagedDomainsFromRules()
    closeOpenTabsForManagedDomains()
});

const removeRules = () => {
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
        const ruleIdsToRemove = rules.map(rule => rule.id);

        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: ruleIdsToRemove
        }, () => {
            console.log("All dynamic rules have been removed.");
        });
    });
}

// Do not remove all rules on load; we rely on persistent rules for domain blocking

chrome.action.onClicked.addListener(async () => {
    // Keep rules intact; just open subscriptions page
    chrome.tabs.create({ url: "https://app.nexustoolz.com/subscriptions" }, function (createdTab) { });
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {

    if (message.type === 'FROM_NT_APP') {

        console.log(`[DEBUG] Received message from NT APP`);

        sendResponse({ success: true });

        let data = null;
        try {
            // New token-based system
            if (message.token) {
                // Fetch encrypted data using token
                const token = message.token;
                console.log(`[DEBUG] Fetching data with token: ${token.substring(0, 8)}...`);
                
                const response = await fetch('https://api.nexustoolz.com/api/user/get-session-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token: token })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`[DEBUG] Failed to fetch session data: ${response.status} - ${errorText}`);
                    throw new Error(`Failed to fetch session data: ${response.status} - ${errorText}`);
                }

                const encryptedData = await response.text();
                
                if (!encryptedData || encryptedData.trim() === '') {
                    console.error(`[DEBUG] Empty encrypted data received`);
                    throw new Error('Empty encrypted data received from server');
                }
                
                console.log(`[DEBUG] Received encrypted data, length: ${encryptedData.length}`);
                
                let none = "SCYwiK5IO6uaXwlk9imevmEaNZ3RtXpRiNGwMjP3lb16RjJtu2";
                console.log(`[DEBUG] Starting decryption, encrypted data length: ${encryptedData.length}`);
                
                let decryptedText;
                try {
                    decryptedText = await decrypt(encryptedData, none);
                } catch (decryptError) {
                    console.error(`[DEBUG] Decryption error:`, decryptError);
                    throw decryptError;
                }
                
                if (decryptedText === undefined || decryptedText === null) {
                    console.error(`[DEBUG] Decryption returned undefined/null`);
                    throw new Error('Decryption returned undefined');
                }
                
                if (typeof decryptedText !== 'string') {
                    console.error(`[DEBUG] Decryption returned non-string:`, typeof decryptedText);
                    throw new Error('Decryption returned non-string: ' + typeof decryptedText);
                }
                
                if (decryptedText.trim() === '') {
                    console.error(`[DEBUG] Decryption returned empty string`);
                    throw new Error('Decryption returned empty string');
                }
                
                console.log(`[DEBUG] Decrypted text length: ${decryptedText.length}, first 50 chars: ${decryptedText.substring(0, 50)}`);
                
                try {
                    data = JSON.parse(decryptedText);
                    console.log(`[DEBUG] Successfully parsed JSON data`);
                } catch (parseError) {
                    console.error(`[DEBUG] JSON parse error:`, parseError);
                    console.error(`[DEBUG] Decrypted text that failed to parse (full):`, decryptedText);
                    throw new Error('Failed to parse decrypted data as JSON: ' + parseError.message);
                }
            } else if (message.method && message.url) {
                // Legacy support (direct data)
                data = {
                    method: message.method,
                    url: message.url,
                    tri9: message.tri9 || '[]',
                    hyd3liya: message.hyd3liya || '[]',
                    data: message.data || '[]'
                };
            } else if (message.text) {
                // Legacy support (encrypted text)
                let none = "SCYwiK5IO6uaXwlk9imevmEaNZ3RtXpRiNGwMjP3lb16RjJtu2";
                const encryptedText = typeof message.text === 'string' ? message.text : JSON.parse(message.text);
                
                let decryptedText;
                try {
                    decryptedText = await decrypt(encryptedText, none);
                } catch (decryptError) {
                    console.error(`[DEBUG] Legacy decryption error:`, decryptError);
                    throw decryptError;
                }
                
                if (decryptedText === undefined || decryptedText === null) {
                    console.error(`[DEBUG] Legacy decryption returned undefined/null`);
                    throw new Error('Decryption returned undefined');
                }
                
                if (typeof decryptedText !== 'string') {
                    console.error(`[DEBUG] Legacy decryption returned non-string:`, typeof decryptedText);
                    throw new Error('Decryption returned non-string: ' + typeof decryptedText);
                }
                
                if (decryptedText.trim() === '') {
                    throw new Error('Decryption returned empty string');
                }
                
                try {
                    data = JSON.parse(decryptedText);
                } catch (parseError) {
                    console.error(`[DEBUG] Legacy JSON parse error:`, parseError);
                    console.error(`[DEBUG] Decrypted text:`, decryptedText);
                    throw new Error('Failed to parse decrypted data as JSON: ' + parseError.message);
                }
            }
        } catch (error) {
            console.error(`[DEBUG] Error parsing message:`, error);
            console.error(`[DEBUG] Error message:`, error.message);
            console.error(`[DEBUG] Error stack:`, error.stack);
            console.error(`[DEBUG] Message received:`, message);
            return;
        }
        
        if (!data) {
            console.error(`[DEBUG] Data is null or undefined after parsing`);
            return;
        }
        
        if (!data.url) {
            console.error(`[DEBUG] Data missing URL:`, data);
            return;
        }
        
        const du = new URL(data.url).hostname.split('.').slice(-2).join('.');

        console.log(`[DEBUG] Method: ${data.method}, URL: ${data.url}, Domain: ${du}`);

        if (!data) {
            return
        }

        switch (data.method) {
            case "drhm": {

                console.log(`[UDEMY DEBUG] Method drhm called for URL: ${data.url}`);
                console.log(`[UDEMY DEBUG] Domain (du): ${du}`);

                xps = xps.concat(JSON.parse(data.tri9))
                hyd3liya = hyd3liya.concat(JSON.parse(data.hyd3liya))

                let CookiesToSet = ""

                JSON.parse(data.data).forEach(item => {
                    CookiesToSet += item.name + "=" + item.value + "; ";
                });

                const ruleId = Math.floor(Math.random() * 10000) + 1;

                if (!CookiesToSet || !ruleId) {
                    return
                }

                await chrome.declarativeNetRequest.updateDynamicRules({
                    removeRuleIds: [ruleId],
                    addRules: [{
                        id: ruleId,
                        priority: ruleId,
                        action: {
                            type: "modifyHeaders",
                            requestHeaders: [
                                {
                                    header: "User-Agent",
                                    operation: "set",
                                    value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
                                },
                                { header: "Cookie", operation: "set", value: CookiesToSet },
                                { header: "Set-Cookie", operation: "remove" }
                            ]
                        },
                        condition: {
                            urlFilter: "*" + du + "*",
                            resourceTypes: [
                                "csp_report",
                                "font",
                                "image",
                                "main_frame",
                                "media",
                                "object",
                                "other",
                                "ping",
                                "script",
                                "stylesheet",
                                "sub_frame",
                                "webbundle",
                                "websocket",
                                "webtransport",
                                "xmlhttprequest"]
                        }
                    }]
                });

                await chrome.tabs.create({ url: data.url }, async (tab) => {
                    if (!tis.includes(tab.id)) {
                        if (!udta.includes(du)) {
                            udta.push(du)
                            await ensureBlockRuleForDomain(du)
                        }
                        ttnrc.push(tab.id)
                        ttnrc.push(du)
                        tis.push(tab.id)
                        // Add domain to allowed cookies list
                        if (!allowedDomainsForCookies.includes(du)) {
                            allowedDomainsForCookies.push(du)
                            console.log(`[UDEMY DEBUG] Added domain to allowedDomainsForCookies: ${du}`);
                            console.log(`[UDEMY DEBUG] Current allowedDomainsForCookies:`, allowedDomainsForCookies);
                        }
                    }
                    await addAllowRuleForTab(du, tab.id)

                    // Small delay to ensure tab is ready
                    await new Promise(resolve => setTimeout(resolve, 100));

                    // Also set cookies permanently in browser for better persistence
                    console.log(`[UDEMY DEBUG] Setting ${JSON.parse(data.data).length} cookies for domain: ${du}`);
                    
                    JSON.parse(data.data).forEach(cookie => {
                        try {
                            const cookieDomain = cookie.domain || du;
                            const cookieUrl = `${cookie.secure ? 'https' : 'http'}://${cookieDomain.replace(/^\./, '')}${cookie.path || '/'}`;
                            
                            const cookieDetails = {
                                url: cookieUrl,
                                name: cookie.name,
                                value: cookie.value,
                                path: cookie.path || '/'
                            };

                            // Only set domain if not hostOnly
                            if (!cookie.hostOnly && cookie.domain) {
                                cookieDetails.domain = cookie.domain;
                            }

                            if (cookie.secure !== undefined) {
                                cookieDetails.secure = cookie.secure;
                            }

                            if (cookie.httpOnly !== undefined) {
                                cookieDetails.httpOnly = cookie.httpOnly;
                            }

                            if (cookie.expirationDate) {
                                cookieDetails.expirationDate = cookie.expirationDate;
                            }

                            if (cookie.sameSite && cookie.sameSite !== null) {
                                cookieDetails.sameSite = cookie.sameSite;
                            }

                            chrome.cookies.set(cookieDetails, (setCookie) => {
                                if (chrome.runtime.lastError) {
                                    console.log(`[UDEMY DEBUG] Failed to set cookie ${cookie.name}:`, chrome.runtime.lastError.message);
                                } else {
                                    console.log(`[UDEMY DEBUG] Successfully set cookie: ${cookie.name}`);
                                }
                            });
                        } catch (e) {
                            console.log(`[UDEMY DEBUG] Error setting cookie:`, e);
                        }
                    });

                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        injectImmediately: true,
                        func: () => {
                            // document.addEventListener('contextmenu', event => event.preventDefault());

                            document.addEventListener('keydown', event => {
                                if (
                                    (event.ctrlKey && event.shiftKey && event.key === 'I') ||
                                    (event.ctrlKey && event.shiftKey && event.key === 'J') ||
                                    (event.ctrlKey && event.shiftKey && event.key === 'C') ||
                                    (event.ctrlKey && event.shiftKey && event.key === 'M') ||
                                    (event.ctrlKey && event.key === 'U') ||
                                    event.key === 'F12'
                                ) {
                                    event.preventDefault();
                                }
                            });
                        }
                    });
                });

                break;
            }

            case "drhm-khasr": {
                console.log(`[DEBUG] Method drhm-khasr called for URL: ${data.url}`);
                console.log(`[DEBUG] Domain (du): ${du}`);
                
                xps = xps.concat(JSON.parse(data.tri9))
                hyd3liya = hyd3liya.concat(JSON.parse(data.hyd3liya))

                JSON.parse(data.data).forEach(cookie => {
                    chrome.cookies.set({
                        url: data.url,
                        name: cookie.name,
                        value: cookie.value,
                        domain: cookie.domain,
                        path: cookie.path,
                        secure: cookie.secure,
                        httpOnly: cookie.httpOnly
                    }, (cookie) => {
                        console.log(`Cookie set: ${cookie.name}`);
                    });
                });

                // Open a new tab
                await chrome.tabs.create({ url: data.url }, async (tab) => {
                    if (!tis.includes(tab.id)) {
                        if (!udta.includes(du)) {
                            udta.push(du)
                            await ensureBlockRuleForDomain(du)
                        }
                        ttnrc.push(tab.id)
                        ttnrc.push(du)
                        tis.push(tab.id)
                        // Add domain to allowed cookies list
                        if (!allowedDomainsForCookies.includes(du)) {
                            allowedDomainsForCookies.push(du)
                        }
                    }
                    await addAllowRuleForTab(du, tab.id)

                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        injectImmediately: true,
                        func: () => {
                            // document.addEventListener('contextmenu', event => event.preventDefault());

                            document.addEventListener('keydown', event => {
                                if (
                                    (event.ctrlKey && event.shiftKey && event.key === 'I') ||
                                    (event.ctrlKey && event.shiftKey && event.key === 'J') ||
                                    (event.ctrlKey && event.shiftKey && event.key === 'C') ||
                                    (event.ctrlKey && event.shiftKey && event.key === 'M') ||
                                    (event.ctrlKey && event.key === 'U') ||
                                    event.key === 'F12'
                                ) {
                                    event.preventDefault();
                                }
                            });
                        }
                    });
                });

                break;
            }

            case "dar": {
                console.log(`[DEBUG] Method dar called for URL: ${data.url}`);
                console.log(`[DEBUG] Domain (du): ${du}`);
                
                xps = xps.concat(JSON.parse(data.tri9))
                hyd3liya = hyd3liya.concat(JSON.parse(data.hyd3liya))

                const localData = JSON.parse(JSON.parse(data.data)[0])[0]

                await chrome.tabs.create({ url: data.url }, async function (tab) {

                    if (!tis.includes(tab.id)) {
                        if (!udta.includes(du)) {
                            udta.push(du)
                            await ensureBlockRuleForDomain(du)
                        }
                        tis.push(tab.id)
                        // Add domain to allowed cookies list
                        if (!allowedDomainsForCookies.includes(du)) {
                            allowedDomainsForCookies.push(du)
                        }
                    }
                    await addAllowRuleForTab(du, tab.id)

                    const temp = setInterval(() => {
                        chrome.tabs.sendMessage(tab.id, { greeting: "ls", data: localData }, (response) => {
                            console.log(response);

                            if (response) {
                                clearInterval(temp)

                            }

                            if (chrome.runtime.lastError) {
                                // console.log(`Message failed for tab ${tabId}:`, chrome.runtime.lastError);
                            } else {
                                // console.log(`Response from tab ${tabId}:`, response);
                            }
                        });
                    }, 50);


                });
                break;
            }
            case "revoke": {
                // Immediate revocation for a domain; clear cookies, close tabs, enforce block
                try {
                    const base = du;
                    await ensureBlockRuleForDomain(base);
                    clearAllCookiesForDomain(base);
                    
                    // Remove from allowedDomainsForCookies
                    const domainIndex = allowedDomainsForCookies.indexOf(base);
                    if (domainIndex > -1) {
                        allowedDomainsForCookies.splice(domainIndex, 1);
                    }
                    
                    // Close any open tabs for this domain and remove per-tab allow rules
                    chrome.tabs.query({}, async (tabs) => {
                        for (const t of tabs) {
                            if (t.url) {
                                try {
                                    const h = new URL(t.url).hostname.replace('www.', '');
                                    const b = toBaseDomain(h);
                                    if (b.includes(base)) {
                                        await removeAllowRuleForTab(t.id);
                                        chrome.tabs.remove(t.id);
                                    }
                                } catch (_) { }
                            }
                        }
                    });
                } catch (_) { }
                break;
            }
            default:
                break;
        }
    }
});


function removeElementInTab(tabId, index) {
    chrome.tabs.sendMessage(tabId, { type: "rme", index }, (response) => {
        if (chrome.runtime.lastError) { }
    });
}

chrome.cookies.onChanged.addListener((changeInfo) => {

    if (!changeInfo.removed) {
        const cookie = changeInfo.cookie;
        
        // Normalize cookie domain (remove leading dot)
        const normalizedCookieDomain = cookie.domain.replace(/^\./, '');

        // Check if this cookie's domain is in our managed domains
        const isManagedDomain = udta.some(url => {
            const normalizedUrl = url.replace(/^\./, '');
            return normalizedCookieDomain.includes(normalizedUrl) || normalizedUrl.includes(normalizedCookieDomain);
        });

        if (isManagedDomain) {
            // Only remove cookies if domain is NOT in allowedDomainsForCookies
            const isAllowed = allowedDomainsForCookies.some(domain => {
                const normalizedAllowedDomain = domain.replace(/^\./, '');
                return normalizedCookieDomain.includes(normalizedAllowedDomain) || 
                       normalizedAllowedDomain.includes(normalizedCookieDomain);
            });

            if (!isAllowed) {
                console.log(`[UDEMY DEBUG] Removing cookie ${cookie.name} for domain ${cookie.domain} - NOT in allowedDomainsForCookies`);
                console.log(`[UDEMY DEBUG] allowedDomainsForCookies:`, allowedDomainsForCookies);
                chrome.cookies.remove({
                    url: `https://${cookie.domain}${cookie.path}`,
                    name: cookie.name
                }, (details) => {
                    // Cookie removed from unmanaged domain
                });
            } else {
                console.log(`[UDEMY DEBUG] Cookie ALLOWED: ${cookie.name} for domain: ${cookie.domain}`);
            }
        }
    }
});

chrome.webNavigation.onCreatedNavigationTarget.addListener(async (details) => {

    const { sourceTabId, tabId, url } = details;

    if (sourceTabId && tis.includes(sourceTabId)) {
        // If source tab is managed, also manage the new tab
        if (!tis.includes(tabId)) {
            tis.push(tabId)
        }

        // Also add to ttnrc to preserve cookies
        try {
            const urlObj = new URL(url);
            const baseDomain = toBaseDomain(urlObj.hostname.replace('www.', ''));
            
            if (udta.includes(baseDomain)) {
                if (!ttnrc.includes(tabId)) {
                    ttnrc.push(tabId);
                }
                if (!ttnrc.includes(baseDomain)) {
                    ttnrc.push(baseDomain);
                }
                // Add domain to allowed cookies list
                if (!allowedDomainsForCookies.includes(baseDomain)) {
                    allowedDomainsForCookies.push(baseDomain);
                }
                await addAllowRuleForTab(baseDomain, tabId);
            }
        } catch (e) {
            // Ignore URL parsing errors
        }
    }
})

let xPathIntervalId = null

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {

    try {
        
        if (tab.url && tab.url.includes('udemy.com')) {
            console.log(`[UDEMY DEBUG] Tab updated - tabId: ${tabId}, URL: ${tab.url}`);
            console.log(`[UDEMY DEBUG] Tab is in tis:`, tis.includes(tabId));
            console.log(`[UDEMY DEBUG] changeInfo:`, changeInfo);
        }

        if (hyd3liya.some(kds => tab.url && tab.url.includes(kds))) {
            chrome.tabs.update(tab.id, { url: 'about:blank' });
            chrome.tabs.update(tab.id, { url: `https://${new URL(tab.url).hostname.replace('www.', '')}` });
        }

        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            injectImmediately: true,
            func: () => {
                // document.addEventListener('contextmenu', event => event.preventDefault());

                document.addEventListener('keydown', event => {
                    if (
                        (event.ctrlKey && event.shiftKey && event.key === 'I') ||
                        (event.ctrlKey && event.shiftKey && event.key === 'J') ||
                        (event.ctrlKey && event.shiftKey && event.key === 'C') ||
                        (event.ctrlKey && event.shiftKey && event.key === 'M') ||
                        (event.ctrlKey && event.key === 'U') ||
                        event.key === 'F12'
                    ) {
                        event.preventDefault();
                    }
                });
            }
        });

        if (!tis.includes(tab.id) && tab.url) {
            const base = toBaseDomain(new URL(tab.url).hostname.replace('www.', ''))
            if (udta.some(url => base.includes(url))) {
                // Clear cookies and close the tab
                clearAllCookiesForDomain(base)
                chrome.tabs.remove(tab.id);
                return;
            }
        }

        if (tab.url && udta.some(url => tab.url.includes(url))) {

            chrome.tabs.get(tabId, (tab) => {

                if (!tab) {

                    clearInterval(xPathIntervalId)

                    return
                }
                else {
                    removeElementInTab(tabId, xps);
                }
            })

            // Only remove cookies if tab is not in tis (not a managed tab)
            if (!tis.includes(tabId)) {
                const url = new URL(tab.url);

                chrome.cookies.getAll({}, (cookies) => {

                    const filteredCookies = cookies.filter(cookie => cookie.domain.includes(url.hostname.replace('www.', '')));

                    filteredCookies.forEach(cookie => {
                        chrome.cookies.remove({
                            url: `https://${cookie.domain}${cookie.path}`,
                            name: cookie.name
                        }, (details) => {
                            if (details) {
                                // console.log(`Removed cookie: ${cookie.name}`);
                            } else {
                                // console.log(`Failed to remove cookie: ${cookie.name}`);
                            }
                        });
                    });
                })
            }
        }
    } catch (error) {

    }
});

// Cleanup allow rules when tabs are closed to avoid accumulation
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
    await removeAllowRuleForTab(tabId)
    delete allowedTabStartedAt[tabId];
    delete allowedTabDomainById[tabId];
    
    // Remove from tis
    const tisIndex = tis.indexOf(tabId);
    if (tisIndex > -1) {
        tis.splice(tisIndex, 1);
    }
    
    // Remove from ttnrc
    const ttnrcIndex = ttnrc.indexOf(tabId);
    if (ttnrcIndex > -1) {
        ttnrc.splice(ttnrcIndex, 1);
    }
    
    // Note: We don't remove from allowedDomainsForCookies here
    // because other tabs might be using the same domain
});

// Periodic TTL enforcement: close allowed tabs after TTL and clear their cookies
setInterval(() => {
    const now = Date.now();
    Object.keys(allowedTabStartedAt).forEach((tidStr) => {
        const tid = parseInt(tidStr, 10);
        const startedAt = allowedTabStartedAt[tid];
        if (!startedAt) return;
        if (now - startedAt >= SESSION_TTL_MS) {
            const base = allowedTabDomainById[tid];
            removeAllowRuleForTab(tid).then(() => {
                if (base) {
                    clearAllCookiesForDomain(base);
                    ensureBlockRuleForDomain(base);
                }
                chrome.tabs.remove(tid);
                delete allowedTabStartedAt[tid];
                delete allowedTabDomainById[tid];
            });
        }
    });
}, 60 * 1000);


/**
 * Updated decrypt function for new encryption format
 * Format: base64url string containing [IV(16)][Timestamp(4)][Encrypted Data][HMAC(32)]
 */
async function decrypt(encryptedText, secret) {
    try {
        if (!encryptedText || typeof encryptedText !== 'string') {
            throw new Error('Invalid encrypted text: must be a non-empty string');
        }
        
        if (!secret || typeof secret !== 'string') {
            throw new Error('Invalid secret: must be a non-empty string');
        }
        
        // Remove obfuscation: extract the actual base64url data between separators
        // Format: prefix-base64url-suffix (looks like: abc123def-encrypteddata-xyz789uvw)
        const parts = encryptedText.split('-');
        if (parts.length < 3) {
            console.error(`[DEBUG] Invalid format - parts.length: ${parts.length}, encryptedText preview: ${encryptedText.substring(0, 50)}`);
            throw new Error('Invalid encrypted data format - expected prefix-data-suffix');
        }
        
        // Extract the middle part (the actual encrypted data)
        // Skip first part (prefix) and last part (suffix)
        const base64url = parts.slice(1, -1).join('-'); // Rejoin in case there are multiple separators
        
        // Decode base64url back to base64
        let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        
        // Add padding if needed
        while (base64.length % 4) {
            base64 += '=';
        }
        
        // Convert base64 to Uint8Array
        const binaryString = atob(base64);
        const final = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            final[i] = binaryString.charCodeAt(i);
        }
        
        // Extract components
        const iv = final.slice(0, 16);
        const timestamp = final.slice(16, 20);
        const encrypted = final.slice(20, final.length - 32);
        const receivedHmac = final.slice(final.length - 32);
        
        // Generate key from secret using SHA-256
        const keyData = new TextEncoder().encode(secret);
        const keyHash = await crypto.subtle.digest('SHA-256', keyData);
        
        // Verify HMAC integrity
        const combined = new Uint8Array([...iv, ...timestamp, ...encrypted]);
        
        // Import key for HMAC
        const hmacKey = await crypto.subtle.importKey(
            'raw',
            keyHash,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        
        // Compute expected HMAC
        const expectedHmacBuffer = await crypto.subtle.sign('HMAC', hmacKey, combined);
        const expectedHmac = new Uint8Array(expectedHmacBuffer);
        
        // Constant-time comparison to prevent timing attacks
        if (!timingSafeEqual(receivedHmac, expectedHmac)) {
            throw new Error('HMAC verification failed - data may have been tampered with');
        }
        
        // Check timestamp (prevent replay attacks - data expires after 5 minutes)
        const dataTimestamp = readUInt32BE(timestamp);
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const timeDiff = currentTimestamp - dataTimestamp;
        
        if (timeDiff > 300) { // 5 minutes = 300 seconds
            throw new Error('Data expired - timestamp too old');
        }
        
        if (timeDiff < 0) {
            throw new Error('Invalid timestamp - future date');
        }
        
        // Decrypt the data using AES-256-CBC
        const aesKey = await crypto.subtle.importKey(
            'raw',
            keyHash,
            { name: 'AES-CBC', length: 256 },
            false,
            ['decrypt']
        );
        
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-CBC', iv: iv },
            aesKey,
            encrypted
        );
        
        if (!decrypted || decrypted.byteLength === 0) {
            throw new Error('Decryption returned empty buffer');
        }
        
        const result = new TextDecoder().decode(decrypted);
        
        if (result === undefined || result === null) {
            throw new Error('TextDecoder returned undefined/null');
        }
        
        if (typeof result !== 'string') {
            throw new Error('TextDecoder returned non-string: ' + typeof result);
        }
        
        if (result.trim() === '') {
            throw new Error('Decryption returned empty result');
        }
        
        console.log(`[DEBUG] Decrypt function returning result, length: ${result.length}`);
        return result;
    } catch (error) {
        console.error('[DEBUG] Decryption failed:', error);
        console.error('[DEBUG] Error type:', typeof error);
        console.error('[DEBUG] Error message:', error.message);
        console.error('[DEBUG] Error stack:', error.stack);
        console.error('[DEBUG] Encrypted text length:', encryptedText ? encryptedText.length : 'null');
        console.error('[DEBUG] Encrypted text preview:', encryptedText ? encryptedText.substring(0, 50) : 'null');
        console.error('[DEBUG] Secret length:', secret ? secret.length : 'null');
        throw new Error('Decryption failed: ' + (error.message || String(error)));
    }
}

/**
 * Helper function: Read UInt32BE from Uint8Array
 */
function readUInt32BE(buffer) {
    return (buffer[0] << 24) | (buffer[1] << 16) | (buffer[2] << 8) | buffer[3];
}

/**
 * Constant-time comparison to prevent timing attacks
 */
function timingSafeEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a[i] ^ b[i];
    }
    
    return result === 0;
}