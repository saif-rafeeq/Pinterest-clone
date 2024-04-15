
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/uploads");
  },
  filename: function (req, file, cb) {
    const fn = uuidv4();
    cb(null, fn + path.extname(file.originalname));
  },
});

function fileFilter(req, file, cb) {
  const check = path.extname(file.originalname).toLowerCase();
  if (
    check === ".png" ||
    check === ".jpg" ||
    check === ".svg" ||
    check === ".webp" ||
    check === ".jpeg"
  ) {
    cb(null, true);
  } else {
    cb(
      new Error("You can only upload png, jpg, svg, webp and jpeg files"),
      false
    );
  }
}

const storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/uploads2");
  },
  filename: function (req, file, cb) {
    const fn = uuidv4();
    cb(null, fn + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const upload2 = multer({
  storage: storage2,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

module.exports = { upload, upload2 };