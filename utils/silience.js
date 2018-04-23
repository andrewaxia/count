const crypto = require('crypto');
const config =require('config') 

module.exports={
    'silience':function(msg){
        const cipher = crypto.createCipher('aes192', config.get("secrets.systemSecret"));
        let encrypted = cipher.update(msg, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // console.log(encrypted);
        return encrypted; 


    },
    'open':function(cipherMsg){
        const decipher = crypto.createDecipher('aes192', config.get("secrets.systemSecret");
        let decrypted = decipher.update(cipherMsg, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        console.log(decrypted);
        return decrypted; 
    }
}



