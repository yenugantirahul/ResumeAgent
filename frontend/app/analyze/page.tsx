import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ResumeAgent | Analyze",
};

export default function AnalyzePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Resume analysis
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Analyze your resume
        </h1>

        <p className="mt-3 text-muted-foreground">
          Upload your resume and add the job description you want to target.
        </p>
      </div>

      <div className="mt-10 space-y-8">
        <section>
          <label className="mb-3 block text-sm font-medium">
            Resume
          </label>

          <div className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
            <p className="font-medium">Upload your resume</p>

            <p className="mt-2 text-sm text-muted-foreground">
              PDF files only
            </p>

            <button className="mt-5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">
              Choose file
            </button>
          </div>
        </section>

        <section>
          <label
            htmlFor="job-description"
            className="mb-3 block text-sm font-medium"
          >
            Job description
          </label>

          <textarea
            id="job-description"
            placeholder="Paste the job description here..."
            className="min-h-64 w-full resize-none rounded-xl border bg-background p-4 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </section>

        <div className="flex justify-end">
          <button className="rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90">
            Analyze resume
          </button>
        </div>
      </div>
    </main>
  );
}