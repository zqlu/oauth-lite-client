/*eslint-env node, mocha */
var fs = require("fs");
var path = require("path");
var should = require("should");
var prompt = require("prompt");
var OAuth = require("../../");

function test(name, json) {
    describe('OAuth1 ' + name, function() {
        var opt = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/', json)));
        var client;

        before(function(done) {
            client = new OAuth.OAuth1(opt);
            done();
        });

        it('Shoud get request token', function(done) {
            client.requestToken(function(err, res, body) {
                should.not.exist(err);
                should.equal(res.statusCode, 200);
                should(body).have.property('oauth_token');
                done();
            });
        });

        it('Should get authorize url', function(done) {
            client.getAuthorizeUrl(function(err, url) {
                should.not.exist(err);
                should(url).be.a.String();
                done();
            });
        });

        context("User not authorized", function() {
            it('Should get error when accessToken', function(done) {
                client.token(function(err, res, body) {
                    should.not.exist(err);
                    should.notEqual(res.statusCode, 200);
                    done();
                });
            });

            it('Shoud get error when accountInfo', function(done) {
                client.accountInfo(function(err, res) {
                    should.not.exist(err);
                    should.notEqual(res.statusCode, 200);
                    done();
                });
            });
        });

        context("User authorized", function() {
            var authorization = {};
            var accountInfo;

            before(function(done) {
                client.getAuthorizeUrl(function(err, url) {
                    var schema = {
                        properties: {
                            code: {
                                message: 'Press enter or input the code to continue'
                            }
                        }
                    };
                    if (err) {
                        throw err;
                    }
                    prompt.start();
                    console.log('Please authoriz by visit ' + url);
                    prompt.get(schema, function(err, res) {
                        if (err) {
                            throw err;
                        }
                        if (res && res.code) {
                            authorization = {
                                oauth_verifier: res.code
                            };
                        }
                        done();
                    });
                });
            });

            it('Should get accessToken', function(done) {
                client.token(authorization, function(err, res, body) {
                    should.not.exist(err);
                    should.equal(res.statusCode, 200);
                    should(body).have.property('oauth_token');
                    done();
                });
            });

            it('Shoud get accountInfo', function(done) {
                client.accountInfo(function(err, res, body) {
                    should.not.exist(err);
                    should.equal(res.statusCode, 200);
                    should.exist(body);
                    accountInfo = body;
                    done();
                });
            });

            if (opt.request) {
                opt.request.forEach(function(req, idx) {
                    it("Should pass test request " + idx, function(done) {
                        client.request(opt.request[0], function(err, res, body) {
                            should.not.exist(err);
                            should.equal(res.statusCode, 200);
                            done();
                        });
                    });
                });
            }


            after(function(done) {
                console.log('accountInfo:\n' + accountInfo);
                done();
            });
        });
    });
}

module.exports = test;
