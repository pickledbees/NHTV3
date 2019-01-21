var fs     = require("fs"),
    path   = require("path"),
    should = require("should"),
    File   = require("../");

describe("File", function () {
    var loc = path.join(__dirname, "tmp/a.txt"),
        file = new File(loc);

    function clean(done) {
        file.unlink(function () {
            fs.rmdir(path.join(__dirname, "tmp"), function () {
                done();
            });
        });
    }

    before(clean);
    after(clean);

    describe("constructor", function () {
        it("should initialize with a location property", function () {
            file.location.should.equal(loc);
        });

        it("should initialize with some other defaults", function () {
            file.encoding.should.equal("utf8");
            should.not.exist(file.parse);
            should.not.exist(file.stringify);
        });

        it("should allow overriding the above properties", function () {
            var file = new File("foo.txt", {
                encoding:  "binary",
                parse:     JSON.parse,
                stringify: JSON.stringify
            });

            file.encoding.should.equal("binary");
            file.parse.should.equal(JSON.parse);
            file.stringify.should.equal(JSON.stringify);
        });
    });

    describe("#mkdir()", function () {
        it("should create the directory housing the file", function (done) {
            file.mkdir(function (err) {
                if (err) return done(err);

                fs.exists(path.dirname(this.location), function (exists) {
                    exists.should.be.true;
                    done();
                });
            });
        });
    });

    describe("#write()", function () {
        beforeEach(clean);

        it("should run mkdirp before writing file", function (done) {
            file.write("abc", function (err) {
                if (err) return done(err);

                fs.exists(path.dirname(this.location), function (exists) {
                    exists.should.be.true;
                    done();
                });
            });
        });

        it("should write the file's contents", function (done) {
            var body = "foo";

            file.write(body, function (err) {
                if (err) return done(err);

                fs.readFile(loc, "utf8", function (err, data) {
                    if (err) return done(err);

                    data.should.equal(body);
                    done();
                });
            });
        });

        it("should run the stringify function", function (done) {
            file.stringify = JSON.stringify;

            file.write({ a: "A" }, function (err) {
                if (err) return done(err);

                delete this.stringify;

                fs.readFile(this.location, this.encoding, function (err, contents) {
                    if (err) return done(err);

                    contents.should.equal('{"a":"A"}');
                    done();
                });
            });
        });

        it("should run the callback with the File object as the context", function (done) {
            file.write("blah", function (err) {
                if (err) return done(err);

                this.should.equal(file);
                done();
            });
        });
    });

    describe("#empty()", function () {
        beforeEach(function (done) {
            file.write("aA", done);
        });

        it("should empty the file", function (done) {
            file.empty(function (err) {
                if (err) return done(err);

                fs.readFile(loc, "utf8", function (err, data) {
                    if (err) return done(err);

                    data.should.equal("");
                    done();
                });
            });
        });

        it("should run the callback with the File object as the context", function (done) {
            file.empty(function (err) {
                if (err) return done(err);

                this.should.equal(file);
                done();
            });
        });
    });

    describe("#read()", function () {
        var body = "hello world";

        beforeEach(function (done) {
            file.write(body, done);
        });

        it("should read the file's contents", function (done) {
            file.read(function (err, data) {
                if (err) return done(err);

                data.should.equal(body);
                done();
            });
        });

        it("should run the parse function", function (done) {
            file.parse = JSON.parse;

            file.write('{"a":"A"}', function (err) {
                if (err) return done(err);

                file.read(function (err, contents) {
                    if (err) return done(err);

                    delete this.parse;

                    contents.should.eql({ a: "A" });
                    done();
                });
            });
        });

        it("should run the callback with the File object as the context", function (done) {
            file.read(function (err) {
                if (err) return done(err);

                this.should.equal(file);
                done();
            });
        });
    });

    describe("#unlink()", function () {
        beforeEach(function (done) {
            file.write("foo bar baz", done);
        });

        it("should have #del() as an alias", function () {
            file.del.should.equal(file.unlink);
        });

        it("should delete the file", function (done) {
            file.unlink(function (err) {
                if (err) return done(err);

                fs.exists(this.location, function (exists) {
                    exists.should.be.false;
                    done();
                });
            });
        });

        it("should run the callback with the File object as the context", function (done) {
            file.del(function (err) {
                if (err) return done(err);

                this.should.equal(file);
                done();
            });
        });
    });

    describe("#exists()", function () {
        it("should be true if the file exists", function (done) {
            file.write("a", function (err) {
                if (err) return done(err);

                file.exists(function (exists) {
                    exists.should.be.true;
                    done();
                });
            });
        });

        it("should be false if the file does not exist", function (done) {
            file.del(function (err) {
                if (err) return done(err);

                file.exists(function (exists) {
                    exists.should.be.false;
                    done();
                });
            });
        });

        it("should run the callback with the File object as the context", function (done) {
            file.exists(function () {
                this.should.equal(file);
                done();
            });
        });
    });

    describe("#stat()", function () {
        beforeEach(function (done) {
            file.write("abc ABC", done);
        });

        it("should get a stat object for the file", function (done) {
            file.stat(function (err, stat) {
                if (err) return done(err);

                stat.should.be.instanceof(fs.Stats);
                done();
            });
        });

        it("should run the callback with the File object as the context", function (done) {
            file.stat(function (err) {
                if (err) return done(err);

                this.should.equal(file);
                done();
            });
        });
    });
});
