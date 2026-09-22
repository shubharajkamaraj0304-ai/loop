import bcrypt from "bcryptjs";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  UserRole,
  FeedbackSource,
  FeedbackStatus,
} from "../app/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const themes = [
  {
    name: "Product Quality",
    description: "Feedback about product quality, reliability, and performance.",
  },
  {
    name: "Customer Support",
    description: "Feedback about customer service and support experience.",
  },
  {
    name: "Pricing",
    description: "Feedback about pricing, discounts, and value for money.",
  },
  {
    name: "User Experience",
    description: "Feedback about usability, navigation, and overall experience.",
  },
  {
    name: "Delivery",
    description: "Feedback about shipping, delivery speed, and packaging.",
  },
  {
    name: "Features",
    description: "Requests and feedback about product features.",
  },
];

const feedbackTemplates = [
  "The product quality is excellent and I am very satisfied.",
  "The product works well but the user interface could be improved.",
  "Customer support responded quickly and solved my issue.",
  "The support team took too long to respond to my request.",
  "The pricing is reasonable for the features provided.",
  "The product feels expensive compared with similar products.",
  "The delivery was very fast and the package arrived safely.",
  "My order arrived late and the delivery experience was disappointing.",
  "The application is easy to use and navigation is simple.",
  "It was difficult to find the settings I needed.",
  "I would like to see more features added to the product.",
  "The latest update improved the overall experience.",
  "The product stopped working after the latest update.",
  "The service provides good value for the money.",
  "The packaging was excellent and protected the product well.",
];

async function main() {
  console.log("Starting database seed...");

  // Clear existing data
  await prisma.feedbackTheme.deleteMany();
  await prisma.embedding.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.theme.deleteMany();
  await prisma.report.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();

  // Create demo workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: "LOOP Demo Workspace",
      slug: "loop-demo",
    },
  });

  console.log(`Created workspace: ${workspace.name}`);

  //  // Create demo users
  const hashedPassword = await bcrypt.hash("demo-password", 10);

  await prisma.user.createMany({
    data: [
      {
        name: "Admin User",
        email: "admin@loop.demo",
        password: hashedPassword,
        role: UserRole.ADMIN,
        workspaceId: workspace.id,
      },
      {
        name: "Analyst User",
        email: "analyst@loop.demo",
        password: hashedPassword,
        role: UserRole.ANALYST,
        workspaceId: workspace.id,
      },
      {
        name: "Viewer User",
        email: "viewer@loop.demo",
        password: hashedPassword,
        role: UserRole.VIEWER,
        workspaceId: workspace.id,
      },
    ],
  });

  console.log("Created 3 demo users.");
  // Create themes
  const createdThemes = await Promise.all(
    themes.map((theme) =>
      prisma.theme.create({
        data: {
          ...theme,
          workspaceId: workspace.id,
        },
      })
    )
  );

  console.log(`Created ${createdThemes.length} themes.`);

  // Create 120 feedback records
  const feedbackData = Array.from({ length: 120 }, (_, index) => {
    const template = feedbackTemplates[index % feedbackTemplates.length];

    const sentiment =
      template.includes("excellent") ||
      template.includes("satisfied") ||
      template.includes("quickly") ||
      template.includes("fast") ||
      template.includes("good value")
        ? "POSITIVE"
        : template.includes("difficult") ||
          template.includes("late") ||
          template.includes("disappointing") ||
          template.includes("expensive") ||
          template.includes("stopped")
        ? "NEGATIVE"
        : "NEUTRAL";

    return {
      workspaceId: workspace.id,
      text: `${template} Feedback item #${index + 1}.`,
      source:
        index % 4 === 0
          ? FeedbackSource.CSV
          : index % 4 === 1
          ? FeedbackSource.API
          : FeedbackSource.MANUAL,
      status:
        index % 10 === 0
          ? FeedbackStatus.RESOLVED
          : index % 5 === 0
          ? FeedbackStatus.REVIEWED
          : FeedbackStatus.NEW,
      sentiment,
      rating:
        sentiment === "POSITIVE"
          ? 4 + (index % 2)
          : sentiment === "NEGATIVE"
          ? 1 + (index % 2)
          : 3,
      customerName: `Customer ${index + 1}`,
      customerEmail: `customer${index + 1}@example.com`,
    };
  });

  await prisma.feedback.createMany({
    data: feedbackData,
  });

  console.log("Created 120 feedback records.");

  // Connect feedback to themes
  const feedbackRecords = await prisma.feedback.findMany({
    where: {
      workspaceId: workspace.id,
    },
    orderBy: {
      id: "asc",
    },
  });

  const feedbackThemeData = feedbackRecords.map((feedback, index) => {
    const theme = createdThemes[index % createdThemes.length];

    return {
      feedbackId: feedback.id,
      themeId: theme.id,
      confidence: 0.75 + (index % 20) / 100,
    };
  });

  await prisma.feedbackTheme.createMany({
    data: feedbackThemeData,
  });

  console.log("Connected feedback to themes.");

  // Create demo report
  await prisma.report.create({
    data: {
      workspaceId: workspace.id,
      title: "Demo Voice of Customer Report",
      content:
        "This is a demo report generated from customer feedback for the LOOP platform.",
    },
  });

  console.log("Created demo report.");

  console.log("Seed completed successfully!");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });