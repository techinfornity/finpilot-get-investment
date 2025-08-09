
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const region = 'ap-south-1';
const ddbClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const fetchAllFromTable = async (tableName, userId) => {
    let params = { TableName: tableName };
    if (userId) {
        params = {
            ...params,
            FilterExpression: '#uid = :uid',
            ExpressionAttributeNames: { '#uid': 'user_id' },
            ExpressionAttributeValues: { ':uid': userId }
        };
    }
    const data = await docClient.send(new ScanCommand(params));
    return data.Items || [];
};

const fetchAssetTable = async (assetType, userId) => {
    const tableMap = {
        CASH: 'fp_cash_investment',
        FD: 'fp_fd_investment',
        REAL_ESTATE: 'fp_real_estate_investment',
        GOLD: 'fp_gold_investment',
    };
    const tableName = tableMap[assetType] || 'fp_cash_investment';
    return fetchAllFromTable(tableName, userId);
};

const getAssetDetails = async (assetType, userId) => {
    const investments = await fetchAssetTable(assetType, userId);
    switch (assetType) {
        case 'CASH':
            return investments.map(investment => ({
                bankName: investment['bank_name'],
                accountNo: investment['account_no'],
                balance: investment['balance'],
                sk: investment['sk']
            }));
        case 'FD':
            return investments.map(investment => ({
                bank: investment['bank'],
                amount: investment['amount'],
                rate: investment['rate'],
                maturityDate: investment['maturity_date'],
                sk: investment['sk']
            }));
        case 'REAL_ESTATE':
            return investments.map(investment => ({
                name: investment['name'],
                buyPrice: investment['buy_price'],
                marketPrice: investment['market_price'],
                sk: investment['sk']
            }));
        case 'GOLD':
            return investments.map(investment => ({
                type: investment['type'],
                weight: investment['weight'],
                buyPrice: investment['buy_price'],
                marketPrice: investment['market_price'],
                sk: investment['sk']
            }));
        default:
            return [];
    }
};

module.exports = { getAssetDetails };