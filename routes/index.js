var express = require("express");
var router = express.Router();
var multer = require("multer");
var path = require("path");
var fs = require("fs");

//create a '/' GET route that'll return the index.html file stored in the public/html folder
router.get("/", function (req, res, next) {
  //if there are no image filenames in a session, return the normal HTML page
  if (req.session.imagefiles === undefined) {
    res.sendFile(path.join(__dirname, "..", "/public/html/index.html"));
  } else {
    //if there are image filenames stored in a session, render them in an index.jade file
    res.render("index", { images: req.session.imagefiles });
  }
});

//multer file storage configuration
let storage = multer.diskStorage({
  //store the images in the public/images folder
  destination: function (req, file, cb) {
    cb(null, "public/images");
  },
  //rename the images
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + "." + file.mimetype.split("/")[1]
    );
  },
});

//configuration for file filter
let fileFilter = (req, file, callback) => {
  let ext = path.extname(file.originalname);
  //if the file extension isn't '.png' or '.jpg' return an error page else return true
  if (ext !== ".png" && ext !== ".jpg") {
    return callback(new Error("Only png and jpg files are accepted"));
  } else {
    return callback(null, true);
  }
};

//initialize Multer with the configurations for storage and file filter
var upload = multer({ storage, fileFilter: fileFilter });

router.post("/upload", upload.array("images"), function (req, res) {
  let files = req.files;
  let imgNames = [];

  //extract the filenames
  for (i of files) {
    let index = Object.keys(i).findIndex(function (e) {
      return e === "filename";
    });
    imgNames.push(Object.values(i)[index]);
  }
  //store the image filenames in a session
  req.session.imagefiles = imgNames;

  //redirect the request to the root URL route
  res.redirect("/");
});

//import PDFkit
var PDFDocument = require("pdfkit");
const { unlink } = require("fs/promises");

router.post("/pdf", function (req, res, next) {
  let body = req.body;

  //Create a new pdf
  let doc = new PDFDocument({ size: "A4", autoFirstPage: false });
  let pdfName = "pdf-" + Date.now() + ".pdf";

  //store the pdf in the public/pdf folder
  doc.pipe(
    fs.createWriteStream(path.join(__dirname, "..", `/public/pdf/${pdfName}`))
  );

  //create the pdf pages and add the images
  for (let name of body) {
    doc.addPage();
    doc.image(path.join(__dirname, "..", `/public/images/${name}`), 20, 20, {
      width: 555.28,
      align: "center",
      valign: "center",
    });
  }
  //end the process
  doc.end();

  //send the address back to the browser
  res.send(`/pdf/${pdfName}`);
});

router.get("/new", function (req, res, next) {
  //delete the files stored in the session
  let filenames = req.session.imagefiles;

  let deleteFiles = async (paths) => {
    let deleting = paths.map((file) =>
      unlink(path.join(__dirname, "..", `/public/images/${file}`))
    );
    await Promise.all(deleting);
  };
  deleteFiles(filenames);

  //remove the data from the session
  req.session.imagefiles = undefined;

  //redirect to the root URL
  res.redirect("/");
});

module.exports = router;
