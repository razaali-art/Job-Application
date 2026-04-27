import ImageTabs from "@/components/image-tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, CheckCircle2, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white overflow-x-hidden">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-black mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              A better way to track your job application.
            </h1>

            <p className="text-muted-foreground mb-10 text-base sm:text-lg md:text-xl px-2">
              Capture, organize, and manage your job search in one place.
            </p>

            <div className="flex flex-col items-center gap-4">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-medium w-full sm:w-auto"
                >
                  Start for free <ArrowRight className="ml-2" />
                </Button>
              </Link>

              <p className="text-sm text-muted-foreground text-center px-2">
                Free forever. No credit card required.
              </p>
            </div>
          </div>
        </section>

        {/* Hero Images Section with Tabs */}
        <ImageTabs />

        {/* Features Section */}
        <section className="border-t bg-white py-16 sm:py-20 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 md:gap-12 md:grid-cols-3">
              <div className="flex flex-col">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>

                <h3 className="mb-3 text-xl sm:text-2xl font-semibold text-black">
                  Organize Applications
                </h3>

                <p className="text-muted-foreground text-sm sm:text-base">
                  Create custom boards and columns to track your job
                  applications at every stage of the process.
                </p>
              </div>

              <div className="flex flex-col">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>

                <h3 className="mb-3 text-xl sm:text-2xl font-semibold text-black">
                  Track Progress
                </h3>

                <p className="text-muted-foreground text-sm sm:text-base">
                  Monitor your application status from applied to interview to
                  offer with visual Kanban boards.
                </p>
              </div>

              <div className="flex flex-col">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>

                <h3 className="mb-3 text-xl sm:text-2xl font-semibold text-black">
                  Stay Organized
                </h3>

                <p className="text-muted-foreground text-sm sm:text-base">
                  Never lose track of an application. Keep all your job search
                  information in one centralized place.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}