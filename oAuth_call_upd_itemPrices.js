/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */
define(['N/https', 'N/record', 'N/log', 'N/search'],
    function (https, record, log, search) {

        function getInputData() {

            // Load all inventory items
            var itemSearch = search.create({
                type: search.Type.INVENTORY_ITEM,
                columns: ['internalid']
            });

            return itemSearch;
        }

        function map(context) {
            try {
                var clientId = 'CLIENT_ID';
                var clientSecret = 'CLIENT_SECRET';
                var sampleAuthenticateUrl = 'http://samplecall.com/authenticate';
                var sampleItemsUrl = 'http://samplecall.com/items/ItemNo';

                // Get the search result or key
                var itemId = context.value;

                var accessToken = authenticate(clientId, clientSecret, sampleAuthenticateUrl);

                var itemUrl = sampleItemsUrl + itemId;
                var headers = {
                    'Authorization': 'Bearer ' + accessToken
                };

                var response = https.get({
                    url: itemUrl,
                    headers: headers
                });

                var responseBody = JSON.parse(response.body);

                // Assuming the name is price
                var updatedPrice = responseBody.price;

                context.write({
                    key: itemId,
                    value: {
                        updatedPrice: updatedPrice,
                    }
                });

            } catch (e) {
                log.error({
                    title: 'Error in Map',
                    details: e
                });
            }
        }

        function reduce(context) {
            try {
                // Update the item record with the new price
                var itemId = context.key;
                var itemRecord = record.load({
                    type: record.Type.INVENTORY_ITEM,
                    id: itemId
                });

                var sublistRecord = itemRecord.getSublistSubrecord({
                    sublistId: 'itemvendor',
                    fieldId: 'itemvendorprice',
                    line: 0
                });

                var count = sublistRecord.getLineCount({
                    sublistId: 'itemvendorpricelines'
                });

                for (var i = 0; i < count; i++) {
                    sublistRecord.setSublistValue({
                        sublistId: 'itemvendorpricelines',
                        fieldId: 'vendorprice',
                        line: i,
                        value: context.value.updatedPrice
                    });
                }

                itemRecord.save();

            } catch (e) {
                log.error({
                    title: 'Error in Reduce',
                    details: e
                });
            }
        }

        function summarize(summary) {
            log.audit({
                title: 'Script Complete',
                details: 'Processed ' + summary.inputSummary + ' records.'
            });
        }

        function authenticate(clientId, clientSecret, url) {
            return 'ACCESS_TOKEN';
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    }
);
