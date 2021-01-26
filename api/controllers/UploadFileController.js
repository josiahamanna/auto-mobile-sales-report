/**
 * UploadFileController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  uploadFile: async (req, res) => {
    req.file("uploadfile").upload(
      {
        maxBytes: 10000000
      },
      async function whenDone(err, uploadedFile) {
        if (err) return res.serverError();

        if (uploadedFile.length === 0)
          return res.badRequest("No file was uploaded");

        await sails.helpers.populateDatabase(uploadedFile[0].fd);

        res.send({
          msg: "File uploaded/import successfully!",
          file: uploadedFile[0]
        });
      }
    );
  }
};
