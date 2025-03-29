const mongoose = require("mongoose");
const fs = require("fs");

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://root:root@ipr.hanid.mongodb.net/chanda?retryWrites=true&w=majority&appName=chanda"
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Simple submission schema
const submissionSchema = new mongoose.Schema({
  aiEvaluation: { type: Object },
});

const Submission = mongoose.model("Submission", submissionSchema);

// Find a submission and check its structure
Submission.findOne({})
  .then((doc) => {
    if (!doc) {
      console.log("No submissions found");
      return;
    }

    console.log("Submission found:");
    console.log("Has aiEvaluation:", !!doc.aiEvaluation);

    if (doc.aiEvaluation) {
      console.log("Has breakdown:", !!doc.aiEvaluation.breakdown);

      if (doc.aiEvaluation.breakdown) {
        console.log("Scores present in breakdown:");
        console.log("- skills_score:", doc.aiEvaluation.breakdown.skills_score);
        console.log(
          "- experience_score:",
          doc.aiEvaluation.breakdown.experience_score
        );
        console.log(
          "- education_score:",
          doc.aiEvaluation.breakdown.education_score
        );
        console.log(
          "- notice_period_score:",
          doc.aiEvaluation.breakdown.notice_period_score
        );
        console.log(
          "- overall_profile_score:",
          doc.aiEvaluation.breakdown.overall_profile_score
        );
        console.log(
          "- achievements_score:",
          doc.aiEvaluation.breakdown.achievements_score
        );
        console.log(
          "- certificates_score:",
          doc.aiEvaluation.breakdown.certificates_score
        );
        console.log(
          "- cultural_fit_score:",
          doc.aiEvaluation.breakdown.cultural_fit_score
        );
      }
    }

    // Save the full document to a JSON file
    fs.writeFileSync("submission.json", JSON.stringify(doc, null, 2));
    console.log("Full submission saved to submission.json");
  })
  .catch((err) => console.error("Error:", err))
  .finally(() => {
    mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  });
