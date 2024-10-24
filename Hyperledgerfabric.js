'use strict';

const { Contract } = require('fabric-contract-api');

class RealEstate extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const properties = [
            {
                location: 'Kerala',
                type: 'Flat',
                color: 'Blue',
                owner: 'Arjun',
            },
            {
                location: 'Kochi',
                type: 'Bungalow',
                color: 'White',
                owner: 'Rahul',
            },
        ];
        


        for (let i = 0; i < properties.length; i++) {
            properties[i].docType = 'property';
            await ctx.stub.putState('PROPERTY' + i, Buffer.from(JSON.stringify(properties[i])));
            console.info('Added <--> ', properties[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async queryProperty(ctx, propertyNumber) {
        const propertyAsBytes = await ctx.stub.getState(propertyNumber); // get the property from chaincode state
        if (!propertyAsBytes || propertyAsBytes.length === 0) {
            throw new Error(`${propertyNumber} does not exist`);
        }
        console.log(propertyAsBytes.toString());
        return propertyAsBytes.toString();
    }

    async createProperty(ctx, propertyNumber, location, type, color, owner) {
        console.info('============= START : Create Property ===========');

        const property = {
            location,
            docType: 'property',
            type,
            color,
            owner,
        };

        await ctx.stub.putState(propertyNumber, Buffer.from(JSON.stringify(property)));
        console.info('============= END : Create Property ===========');
    }

    async queryAllProperties(ctx) {
        const startKey = '';
        const endKey = '';
        const allResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: key, Record: record });
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }

    async changePropertyOwner(ctx, propertyNumber, newOwner) {
        console.info('============= START : changePropertyOwner ===========');

        const propertyAsBytes = await ctx.stub.getState(propertyNumber); // get the property from chaincode state
        if (!propertyAsBytes || propertyAsBytes.length === 0) {
            throw new Error(`${propertyNumber} does not exist`);
        }
        const property = JSON.parse(propertyAsBytes.toString());
        property.owner = newOwner;

        await ctx.stub.putState(propertyNumber, Buffer.from(JSON.stringify(property)));
        console.info('============= END : changePropertyOwner ===========');
    }

    async getPropertyHistory(ctx, propertyNumber) {
        const results = [];
        const iterator = await ctx.stub.getHistoryForKey(propertyNumber);
    
        // Iterate through the history and retrieve each transaction
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                const jsonRes = {
                    txId: res.value.tx_id,
                    timestamp: res.value.timestamp,
                    isDelete: res.value.is_delete,
                    property: JSON.parse(res.value.value.toString('utf8')),
                };
                results.push(jsonRes);
            }
            if (res.done) {
                await iterator.close();
                break;
            }
        }
    
        console.info('History of property:', results);
        return JSON.stringify(results);
    }
    

}

module.exports = RealEstate;
