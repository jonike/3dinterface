import priv = require('../private');
import hash = require('sha256');

var secretKey  = priv.microSecretKey;
var campaignId = priv.microCampaignId;

export = function(workerId : string) : string {

    return 'mw-' + hash(campaignId + workerId + secretKey);

};
