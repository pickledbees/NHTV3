var fs       = require("fs"),
    path     = require("path"),
    should   = require("should"),
    ListFile = require("../").ListFile,
    location = path.join(__dirname, "tmp/test.txt");

describe("ListFile", function () {
    var file = new ListFile(location);

    after(function (done) {
        file.unlink(function () {
            fs.rmdir(path.join(__dirname, "tmp"), function () {
                done();
            });
        });
    });

    describe("#ignore", function () {
        afterEach(function () {
            delete file.ignore;
        });

        it("should ignore a line beginning with the string specified", function () {
            file.ignore = "#";

            file.parse("# this is a comment \nfoo\nbar").should.eql([ "foo", "bar" ]);
            file.parse("").should.have.length(0);
        });

        it("should ignore a line matching the regex specified", function () {
            file.ignore = /^#/;

            file.parse("# this is a comment \nfoo\nbar").should.eql([ "foo", "bar" ]);
            file.parse("").should.have.length(0);
        });

        it("should ignore a line for which the callback returns true", function () {
            file.ignore = function (line) {
                return line[0] === "#";
            };

            file.parse("# this is a comment \nfoo\nbar").should.eql([ "foo", "bar" ]);
            file.parse("").should.have.length(0);
        });
    });

    describe("#parse()", function () {
        it("should turn each line into an array item", function () {
            file.parse("a\nb").should.eql([ "a", "b" ]);
        });

        it("should ignore empty lines", function () {
            file.parse("a\n\nb\nc").should.eql([ "a", "b", "c" ]);
        });

        it("should return an empty array for empty input", function () {
            file.parse("").should.have.length(0);
        });
    });

    describe("#stringify()", function () {
        it("should turn each item of an array into separate lines", function () {
            file.stringify([ "a", "b" ]).should.equal("a\nb");
        });
    });

    describe("#indexOf()", function () {
        before(function (done) {
            file.write([ "a", "b", "c", "A", "B", "C" ], done);
        });

        it("should give the full list as the 3rd callback argument", function (done) {
            file.indexOf("A", function (err, index, list) {
                if (err) return done(err);

                list.should.be.instanceof(Array);
                done();
            });
        });

        it("should return the index of the item that exists", function (done) {
            file.indexOf("c", function (err, index) {
                if (err) return done(err);

                index.should.equal(2);
                done();
            });
        });

        it("should return -1 for something that does not exist", function (done) {
            file.indexOf("e", function (err, index) {
                if (err) return done(err);

                index.should.equal(-1);
                done();
            });
        });

        it("should make the ListFile object as the context for the callback", function (done) {
            file.indexOf("B", function (err) {
                if (err) return done(err);

                this.should.equal(file);
                done();
            });
        });
    });

    describe("#contains()", function () {
        before(function (done) {
            file.write([ "a", "b", "c", "A", "B", "C" ], done);
        });

        it("should give the full list as the 3rd callback argument", function (done) {
            file.contains("A", function (err, contains, list) {
                if (err) return done(err);

                list.should.be.instanceof(Array);
                done();
            });
        });

        it("should return the true for the item that exists", function (done) {
            file.contains("c", function (err, contains) {
                if (err) return done(err);

                contains.should.be.true;
                done();
            });
        });

        it("should return false for the item that does not exist", function (done) {
            file.contains("e", function (err, contains) {
                if (err) return done(err);

                contains.should.be.false;
                done();
            });
        });

        it("should make the ListFile object as the context for the callback", function (done) {
            file.contains("B", function (err) {
                if (err) return done(err);

                this.should.equal(file);
                done();
            });
        });
    });

    describe("#add()", function () {
        beforeEach(function (done) {
            file.write([ "a", "b" ], done);
        });

        it("should append a single item to the list", function (done) {
            file.add("c", function (err) {
                if (err) return done(err);

                file.read(function (err, list) {
                    if (err) return done(err);

                    list.should.eql([ "a", "b", "c" ]);
                    done();
                });
            });
        });

        it("should append multiple items to the list", function (done) {
            file.add([ "c", "d" ], function (err) {
                if (err) return done(err);

                file.read(function (err, list) {
                    if (err) return done(err);

                    list.should.eql([ "a", "b", "c", "d" ]);
                    done();
                });
            });
        });

        it("should make the ListFile object as the context for the callback", function (done) {
            file.add("B", function (err) {
                if (err) return done(err);

                this.should.equal(file);
                done();
            });
        });
    });

    describe("#remove()", function () {
        beforeEach(function (done) {
            file.write([ "a", "b", "c" ], done);
        });

        it("should remove a single item from the list by value", function (done) {
            file.remove("b", function (err) {
                if (err) return done(err);

                this.read(function (err, list) {
                    if (err) return done(err);

                    list.should.eql([ "a", "c" ]);
                    done();
                });
            });
        });

        it("should remove an item from the list by index", function (done) {
            file.remove(1, function (err) {
                if (err) return done(err);

                this.read(function (err, list) {
                    if (err) return done(err);

                    list.should.eql([ "a", "c" ]);
                    done();
                });
            });
        });

        it("should make the ListFile object as the context for the callback", function (done) {
            file.remove("b", function (err) {
                if (err) return done(err);

                this.should.equal(file);
                done();
            });
        });
    });
});
