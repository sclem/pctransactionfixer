let categoryMap = {};

//TODO: this is a race condition with the transaction filter below.
browser.webRequest.onBeforeRequest.addListener(
    listener, {
        urls: ["https://home.personalcapital.com/api/transaction/getUserTransactions"],
        types: ["xmlhttprequest"]
    }, ["blocking"]
);

browser.webRequest.onBeforeRequest.addListener(
    (details) => {
        let filter = browser.webRequest.filterResponseData(details.requestId);
        let decoder = new TextDecoder("utf-8");
        let encoder = new TextEncoder();
        let fulltext = "";

        filter.onstart = () => {
            fulltext = "";
        }

        filter.ondata = event => {
            let str = decoder.decode(event.data, {
                stream: true
            });
            //Append json data until received full request
            fulltext += str;
        }

        filter.onstop = () => {
            let categorydata = JSON.parse(fulltext);
            categorydata.spData.forEach(category => {
                categoryMap[category.transactionCategoryId] = category.type;
            });
            filter.write(encoder.encode(fulltext));
            filter.disconnect();
        }

    }, {
        urls: ["https://home.personalcapital.com/api/transactioncategory/getCategories"],
        types: ["xmlhttprequest"],
    }, ["blocking"]

);

function listener(details) {
    let filter = browser.webRequest.filterResponseData(details.requestId);
    let decoder = new TextDecoder("utf-8");
    let encoder = new TextEncoder();
    let fulltext = "";

    filter.onstart = () => {
        fulltext = "";
    }

    filter.ondata = event => {
        let str = decoder.decode(event.data, {
            stream: true
        });
        //Append json data until received full request
        fulltext += str;
    }

    filter.onstop = () => {
        let transactiondata = JSON.parse(fulltext);
        rewriteTransactions(transactiondata);
        let rewritten = JSON.stringify(transactiondata);
        filter.write(encoder.encode(rewritten));
        filter.disconnect();
    }

    return {};
}

function rewriteTransactions(pcdata) {
    let initialCount = pcdata.spData.transactions.length;
    let finaldata = [];
    let seen = {};
    pcdata.spData.transactions.forEach(trans => {
        //PC sends back duplicate transactions...
        if (seen.hasOwnProperty(trans.userTransactionId)) {
            return;
        }
        seen[trans.userTransactionId] = true;
        switch (categoryMap[trans.categoryId]) {
            case 'INCOME':
                if (!trans.isCredit) {
                    trans.amount *= -1;
                    trans.isCredit = true;
                    trans.transactionType = 'Credit';
                }
                break;
            case 'EXPENSE':
                if (trans.isCredit) {
                    trans.amount *= -1;
                    trans.isCredit = false;
                    trans.transactionType = 'Debit';
                }
                break;
        }
        finaldata.push(trans);
    });
    if (initialCount != finaldata.length) {
        let diff = initialCount - finaldata.length;
        console.log('Hiding ' + diff + ' duplicates from PC API');
    }
    console.log('Processed ' + finaldata.length + ' transactions');
    pcdata.spData.transactions = finaldata;
}
