/**
 * UploadFileController
 *
 * @description :: Upload XLXS file
 */

module.exports = {
  uploadFile: async (req, res) => {
    try {
      req.file("uploadfile").upload(
        {
          maxBytes: 10000000
        },
        async function whenDone(err, uploadedFile) {
          if (err) return res.serverError();

          if (uploadedFile.length === 0)
            return res.badRequest("No file was uploaded");

          const upload = await sails.helpers.uploadXlxs(uploadedFile[0].fd);
          console.log("File uploaded successfully!", uploadedFile);
          if (upload)
            res.send({
              msg: "File uploaded successfully!",
              file: uploadedFile[0]
            });
          else res.send({ status: 500, msg: "File upload failure" });
        }
      );
    } catch (error) {
      console.log(error);
      res.serverError({ status: 500, msg: "Internal server error", error });
    }
  }
};
