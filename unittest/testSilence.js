var expect   = require("chai").expect;
var silence=require("../utils/silience"); 
describe("Test_Silence_Silience", function(){
    describe("test silence's open and silience methods", function() {
        it("See if the cipher works", function () {
            var encrypted =silence.silience("test"); 
            console.log(encrypted); 
            expect(encrypted).equal('7a0734654d32760303c237ee69e9eb28');
        }); 
        it("see if silience open works ",function(){
            var decrypted=silence.open('7a0734654d32760303c237ee69e9eb28');
            console.log(decrypted);  
            expect(decrypted).equal('test'); 
        }); 
        it('test to and from json',function(){
            var jsono={'abc':'aer'}
            console.log(JSON.stringify(jsono));
            var jsons='{"abc":"aer"}'; 
            console.log(JSON.parse(jsons).abc); 
        }); 
    });
});