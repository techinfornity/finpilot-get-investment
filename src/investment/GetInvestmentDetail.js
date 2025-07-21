const { getAssetDetails } = require('./aws/dynamodb/InvestmentRepository');

exports.handler = async (event) => {
    try {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const assetType = body && body.assetType ? body.assetType.toUpperCase() : 'CASH';
        const result = await getAssetDetails(assetType);
        return {
            statusCode: 200,
            body: JSON.stringify({ assetType, details: result })
        };
    } catch (error) {
        console.log(error);
        throw new Error("internal server error");
    }
}