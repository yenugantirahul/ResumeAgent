import Link from "next/link";

export default function Hero() {
  return (
    <section className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="max-w-3xl text-center">
        <div className="mb-5 inline-flex rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
          AI-powered resume analysis
        </div>

        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
          Build a resume that matches the job.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          Upload your resume and job description. Our AI agents analyze your
          skills, measure job compatibility, and suggest improvements based on
          your actual experience.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={"/analyze"} className="rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90">
            Analyze Resume
          </Link>

          <Link href={"/how-it-works"} className="rounded-lg border px-6 py-3 text-sm font-medium transition-colors hover:bg-muted">
            How it works
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          <span>Resume Analysis</span>
          <span>Job Matching</span>
          <span>ATS Insights</span>
          <span>AI Suggestions</span>
        </div>
      </div>
    </section>
  );
}
