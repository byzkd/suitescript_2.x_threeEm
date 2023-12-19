/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */
define(['N/https', 'N/record', 'N/log', 'N/search'],
    function (https, record, log, search) {

        function getInputData() {
            var itemSearch = search.create({
                type: search.Type.INVENTORY_ITEM,
                columns: ['internalid']
            });

            return itemSearch;
        }

        function map(context) {
            try {
                // Load custom company record for token info
                var customRecordSearch = search.create({
                    type: 'customrecord_custom_company_info',
                    columns: ['custrecord_client_id', 'custrecord_client_secret', 'custrecord_authentical_url', 'custrecord_item_url', 'custrecord_access_token'],
                    filters: [
                        ['name', 'is', 'Token Info']
                    ]
                });

                var customRecordResult = customRecordSearch.run().getRange({
                    start: 0,
                    end: 1
                });

                if (customRecordResult.length > 0) {
                    var clientId = customRecordResult[0].getValue('custrecord_client_id');
                    var clientSecret = customRecordResult[0].getValue('custrecord_client_secret');
                    var sampleAuthenticateUrl = customRecordResult[0].getValue('custrecord_authentical_url');
                    var sampleItemsUrl = customRecordResult[0].getValue('custrecord_item_url');
                    var accessToken = customRecordResult[0].getValue('custrecord_access_token');

                    var itemId = context.value;

                    //the access token should not empty, if so, re-authenticate
                    if (!accessToken) {

                        accessToken = authenticate(clientId, clientSecret, sampleAuthenticateUrl);

                        record.submitFields({
                            type: 'customrecord_custom_company_info',
                            id: customRecordResult[0].id,
                            values: {
                                'custrecord_access_token': accessToken
                            }
                        });
                    }

                    var itemUrl = sampleItemsUrl + itemId;
                    var headers = {
                        'Authorization': 'Bearer ' + accessToken
                    };

                    var response = https.get({
                        url: itemUrl,
                        headers: headers
                    });

                    var responseBody = JSON.parse(response.body);
                    var updatedPrice = responseBody.price;

                    context.write({
                        key: itemId,
                        value: {
                            updatedPrice: updatedPrice,
                        }
                    });
                } else {
                    log.error({
                        title: 'Error in Map',
                        details: 'Custom company info record not found.'
                    });
                }

            } catch (e) {
                log.error({
                    title: 'Error in Map',
                    details: e
                });
            }
        }

        function reduce(context) {
            try {
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
            return 'ACCESS_TOKEN'; //acces token logis
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    }
);
