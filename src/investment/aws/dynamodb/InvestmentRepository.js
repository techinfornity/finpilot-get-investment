const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

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
                investmentDate: investment['investment_date'],
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

const getInvestmentSummaryHistory = async (userId) => {
    if (!userId) return [];

    const params = {
        TableName: 'fp_investment_summary',
        KeyConditionExpression: '#uid = :uid',
        ExpressionAttributeNames: { '#uid': 'user_id' },
        ExpressionAttributeValues: { ':uid': userId },
        ScanIndexForward: false, // Descending order by updated_at
        Limit: 12
    };
    try {
        const data = await docClient.send(new QueryCommand(params));
        // Sort by updated_at descending (in case sort key is not updated_at)
        const items = (data.Items || []).sort((a, b) => {
            if (!a.updated_at || !b.updated_at) return 0;
            return b.updated_at.localeCompare(a.updated_at);
        });
        return items.map(item => ({
            userId: item.user_id,
            updatedAt: item.updated_at,
            cash: item.cash,
            fd: item.fd,
            gold: item.gold,
            realEstate: item.real_estate,
            total: item.total
        }));
    } catch (err) {
        console.log('Error fetching investment summary history:', err);
        return [];
    }
};

module.exports = { getAssetDetails, getInvestmentSummaryHistory };