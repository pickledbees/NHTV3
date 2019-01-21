var fs       = require("fs"),
    path     = require("path"),
    should   = require("should"),
    JSONFile = require("../").JSONFile;

describe("JSONFile", function () {
    var file = new JSONFile(path.join(__dirname, "tmp/test.json"));

    after(function (done) {
        file.unlink(function () {
            fs.rmdir(path.join(__dirname, "tmp"), done);
        });
    });

    describe("#parse()", function () {
        it("should have JSON.parse set as the parse property/method", function () {
            file.parse.should.equal(JSON.parse);
        });
    });

    describe("#stringify()", function () {
        it("should json-encode data", function () {
            file.stringify({ a: "A" }).should.equal('{"a":"A"}');
        });

        describe("replacer", function () {
            before(function () {
                file.replacer = function (key, val) {
                    return key.length > 1 ? undefined : val;
                };
            });

            it("should use the replacer function", function () {
                file.stringify({ a: "A", aa: "AA" }).should.equal('{"a":"A"}');
            });

            after(function () {
                file.replacer = null;
            });
        });

        describe("spaces", function () {
            before(function () {
                file.spaces = 2;
            });

            it("should use the replacer function", function () {
                file.stringify({ a: "A" }).should.equal('{\n  "a": "A"\n}');
            });

            after(function () {
                file.spaces = null;
            });
        });
    });

    describe("#merge()", function () {
        before(function (done) {
            file.write({ a: "A", b: "b" }, done);
        });

        it("should merge the contents in (not completely overwrite)", function (done) {
            file.merge({ b: "B", c: "C" }, function (err, contents) {
                contents.should.eql({ a: "A", b: "B", c: "C" });
                done();
            });
        });
    });
});
