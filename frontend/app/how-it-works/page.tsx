import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ResumeAgent | How It works",
};

const steps = [
  {
    number: "01",
    title: "Upload your resume",
    description:
      "Upload your current resume so the system can understand your skills, projects, education, and experience.",
  },
  {
    number: "02",
    title: "Add a job description",
    description:
      "Paste the job description for the role you want to target.",
  },
  {
    number: "03",
    title: "AI agents analyze both",
    description:
      "Specialized agents analyze your resume, understand the job requirements, and compare the two.",
  },
  {
    number: "04",
    title: "Get actionable insights",
    description:
      "Receive a match score, missing skills, weak areas, and suggestions to improve your resume.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-muted-foreground">
          How it works
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          From resume to better application.
        </h1>

        <p className="mt-5 leading-7 text-muted-foreground">
          The platform uses multiple AI agents to understand your resume and
          compare it against a specific job.
        </p>
      </div>

      <div className="mt-16 divide-y border-y">
        {steps.map((step) => (
          <div
            key={step.number}
            className="grid gap-4 py-8 md:grid-cols-[100px_1fr]"
          >
            <span className="text-sm text-muted-foreground">
              {step.number}
            </span>

            <div>
              <h2 className="text-lg font-medium">{step.title}</h2>

              <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}