import { Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/use-in-view";

const WorkshopsSection = () => {
  const [ref, inView] = useInView<HTMLDivElement>();

  return (
    <section id="rollout" className="py-16 lg:py-24 px-4 sm:px-6 relative">
      <div className="max-w-4xl mx-auto">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div
          ref={ref}
          className={`text-center ${inView ? "animate-fade-in-up" : "opacity-0"}`}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Rolling Out for Your Team?
          </h2>
          <p className="text-muted-foreground text-lg sm:text-xl max-w-3xl mx-auto mb-8">
            Let's figure out if Pilot Shell is the right fit for your team and
            get everyone set up.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild>
              <a
                href="https://calendly.com/rittermax/pilot-shell"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Book a Call
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="mailto:mail@maxritter.net">
                <Mail className="mr-2 h-4 w-4" />
                Send a Message
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorkshopsSection;
