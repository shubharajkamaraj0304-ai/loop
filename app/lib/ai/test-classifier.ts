import { classifyFeedback } from "./classifier";

const examples = [
  "The product quality is excellent and delivery was very fast.",
  "The delivery was late and customer support was not helpful.",
  "The website is okay but the checkout process is confusing.",
];

for (const feedback of examples) {
  console.log("\nFeedback:");
  console.log(feedback);

  console.log("\nClassification:");
  console.log(classifyFeedback(feedback));
}