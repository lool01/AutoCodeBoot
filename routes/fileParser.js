var express = require('express');
var router = express.Router();

const fs = require('fs');
const path = require('path');
const mainFolder = path.join(__dirname, "..");
const correctionFolder = path.join(mainFolder, 'correction');
const admzip = require('adm-zip');

const readChunk = require('read-chunk');
const fileType = require('file-type');

const { execSync } = require('child_process');

function toStudent(file, filepath){
    currPath = path.join(filepath, file);

    let zipFile;

    let files = fs.readdirSync(currPath);

    try{
        files = files.map((file) => {
            const buff = readChunk.sync(path.join(currPath, file), 0, fileType.minimumBytes);
            const type = fileType(buff);

            return {
                name : file,
                ext : type === undefined || type === null ? "none" : type.ext
            }
        });

        if(files.length !== 1)
            throw new Error("Zero or More then one file in folder...");

        let file = files[0];

        let studentFiles = [];

        if(file.ext === "zip"){
            let zip = admzip(path.join(currPath, file.name));
            zip.getEntries().forEach((entry) => {
                if(entry.entryName.endsWith(".js") && !entry.entryName.startsWith("__MAC")){

                    populate(studentFiles, entry.getData(), entry.name)
                }
            });
        }
        else {
            let data = fs.readFileSync(path.join(currPath, file.name));
            populate(studentFiles, data, file.name)
        }

        return ({
            name : file.name + " AS TYPE " + file.ext,
            files : studentFiles
        });
    }
    catch(e){
        return {
            name : file,
            error : e
        }
    }
}

function populate(studentFiles, data, name){
    let temppath = path.join(mainFolder, "tmp.js");
    fs.writeFileSync(temppath, data);
    let stdout;
    try{
        stdout = execSync('d8 '+temppath);
    }
    catch (e){
        stdout = e.stack;
    }

    studentFiles.push({
        name : name,
        content : data,
        result : stdout
    })
}

/* GET home page. */
router.get('/:filename', function(req, res, next) {
    const filepath = path.join(correctionFolder, req.params.filename);
    fs.readdir(filepath, (err, files) => {
        if(err){
            res.render("error", {'message': filepath + " doesnt exist", error:err})
            return;
        }

        //console.log(files);

        let students = files.map(x => toStudent(x, filepath));

        console.log(students)
        //buildStudents(filepath, files, (students) => {
        res.render('file', {students:students});
        //})
    });
});

module.exports = router;
