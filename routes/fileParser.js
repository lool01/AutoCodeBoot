var express = require('express');
var router = express.Router();

const fs = require('fs');
const path = require('path');
const mainFolder = path.join(__dirname, "..");
const correctionFolder = path.join(mainFolder, 'correction');
const admzip = require('adm-zip');

const { execSync } = require('child_process');

function toStudent(file, filepath){
    currPath = path.join(filepath, file);

    let zipFile;

    let files = fs.readdirSync(currPath);

    try{
        let zipFiles = files.filter((s) => s.endsWith(".zip"));
        if(zipFiles.length == 1){
            zipFile = path.join(currPath, zipFiles[0]);
        }
        else
            throw new Error("More then one file in folder, cannot choose...");

        //console.log(zipFile);

        let studentFiles = [];

        let zip = admzip(zipFile);
        zip.getEntries().forEach((entry) => {
            //console.log(entry)
            if(entry.entryName.endsWith(".js") && !entry.entryName.startsWith("__MAC")){
                let data = entry.getData();

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
                    name : entry.entryName,
                    content : data,
                    result : stdout
                })
            }
        });

        return ({
            name : file,
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
