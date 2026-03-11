import { ArrowRight, Clock3, ShieldCheck, Sparkles } from "lucide-react";

const metrics = [
  { value: "48h", label: "Average match time" },
  { value: "120+", label: "Vetted specialists" },
  { value: "94%", label: "Repeat client rate" },
];

const featureCards = [
  {
    title: "Fast matching",
    description:
      "Share your scope once and get matched with the right product, design, or engineering support quickly.",
    icon: Clock3,
  },
  {
    title: "Vetted quality",
    description:
      "Every specialist is screened for execution quality, communication, and ability to ship in real teams.",
    icon: ShieldCheck,
  },
  {
    title: "Built for scale",
    description:
      "Start with a quick win, then expand into a longer engagement without changing the workflow.",
    icon: Sparkles,
  },
];

const faqs = [
  {
    question: "How does the matching process work?",
    answer:
      "You share your requirements, goals, and timeline. We review the scope, shortlist the best fit, and help you start with a clear plan.",
  },
  {
    question: "What kind of projects is this best for?",
    answer:
      "It works well for landing pages, product design, frontend builds, rapid MVPs, redesigns, and ongoing growth work where quality matters.",
  },
  {
    question: "Can I start with a smaller engagement first?",
    answer:
      "Yes. Many teams begin with a focused sprint or trial task before expanding into a longer project or retained collaboration.",
  },
  {
    question: "How quickly can we get started?",
    answer:
      "Most projects can begin within a few days once the scope is confirmed and the best-fit specialist is selected.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] font-sans text-white">
      <div className="relative isolate">
        <div className="absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(circle_at_top,_rgba(79,65,185,0.45),_transparent_55%)]" />
        <div className="absolute left-1/2 top-24 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-[#4F41B9]/30 blur-[120px]" />

        <section className="mx-auto max-w-7xl px-6 pb-16 pt-8 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-[#060b1d]/90 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_120px_rgba(6,11,29,0.8)] backdrop-blur">
            <header className="flex flex-col gap-6 px-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#4F41B9] shadow-[0_8px_24px_rgba(79,65,185,0.35)]">

                  <svg className="size-6" data-logo="logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 58 41">
                    <g id="logogram" transform="translate(0, 0) rotate(0) "><path fillRule="evenodd" clipRule="evenodd" d="M14.8333 6.49796L0.603516 20.6199C3.44972 23.4447 6.70108 25.8252 10.246 27.6877C11.2258 30.2671 12.7617 32.6861 14.8535 34.7621C22.7236 42.5725 35.4835 42.5725 43.3535 34.7621C45.4454 32.6861 46.9813 30.2671 47.9611 27.6875C51.5059 25.8252 54.7574 23.4447 57.6035 20.6199L43.3853 6.50945C43.3747 6.49889 43.3642 6.48834 43.3535 6.47779C35.4835 -1.33269 22.7236 -1.33269 14.8535 6.47779C14.8468 6.48452 14.84 6.49124 14.8333 6.49796ZM41.9919 30.2355C37.8452 31.6244 33.4921 32.3357 29.1035 32.3357C24.7149 32.3357 20.362 31.6244 16.2152 30.2355C16.6645 30.8271 17.1606 31.3948 17.7035 31.9337C23.9996 38.1821 34.2074 38.1821 40.5035 31.9337C41.0464 31.3948 41.5426 30.8271 41.9919 30.2355ZM17.9958 9.02337C19.065 9.72438 20.2018 10.3243 21.3914 10.8133C23.8364 11.8184 26.457 12.3357 29.1035 12.3357C31.75 12.3357 34.3706 11.8184 36.8156 10.8133C38.0052 10.3243 39.1421 9.72437 40.2114 9.02334C33.9938 3.15212 24.2132 3.15213 17.9958 9.02337Z" fill="#4F41B9" /></g>
                    <g id="logotype" transform="translate(58, 20.5)"></g>

                  </svg>

                </div>
                <div>
                  <p className="text-lg font-semibold tracking-[-0.03em]">RavenClaw</p>
                  <p className="text-xs tracking-[0.16em] text-white/55 uppercase">Premium digital execution</p>
                </div>
              </div>

              <nav className="flex flex-wrap items-center gap-5 text-sm tracking-[-0.01em] text-white/70">
                <a href="#services" className="transition hover:text-white">
                  Services
                </a>
                <a href="#why-us" className="transition hover:text-white">
                  Why us
                </a>
                <a href="#faq" className="transition hover:text-white">
                  FAQ
                </a>
                <a
                  href="#contact"
                  className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-white transition hover:border-white/20 hover:bg-white/12"
                >
                  Get started
                </a>
              </nav>
            </header>

            <div className="relative overflow-hidden rounded-[2rem] px-6 pb-10 pt-8 lg:px-10 lg:pb-14">
              <div className="pointer-events-none absolute inset-x-6 bottom-0 top-1/3 rounded-[2rem] bg-[linear-gradient(180deg,rgba(79,65,185,0)_0%,rgba(79,65,185,0.2)_42%,rgba(122,109,255,0.68)_100%)] blur-3xl" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-72 items-end justify-center gap-5 opacity-90">
                {[220, 280, 170, 130, 240, 320, 260].map((height) => (
                  <div
                    key={height}
                    className="w-14 rounded-t-[1.75rem] border border-white/6 bg-[linear-gradient(180deg,rgba(79,65,185,0.02)_0%,rgba(79,65,185,0.18)_35%,rgba(167,154,255,0.8)_100%)] shadow-[0_0_40px_rgba(122,109,255,0.18)]"
                    style={{ height }}
                  />
                ))}
              </div>

              <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
                <span className="inline-flex items-center rounded-full border border-[#7a6dff]/30 bg-[#4F41B9]/15 px-4 py-1 text-xs font-medium tracking-[0.28em] text-[#c8c2ff] uppercase">
                  Design-led delivery
                </span>
                <h1 className="mt-8 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
                  Launch standout digital experiences without the hiring chaos
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 tracking-[-0.01em] text-white/68 sm:text-lg">
                  RavenClaw helps teams move from idea to polished execution with sharp design,
                  fast delivery, and a workflow built for modern products.
                </p>

                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#130f32] transition hover:scale-[1.02]"
                  >
                    Start your project
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="#faq"
                    className="inline-flex items-center rounded-full border border-white/14 bg-white/6 px-6 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    Explore FAQ
                  </a>
                </div>

                <div className="mt-14 grid w-full gap-4 sm:grid-cols-3">
                  {metrics.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-3xl border border-white/10 bg-white/5 px-5 py-5 backdrop-blur-sm"
                    >
                      <p className="text-3xl font-semibold tracking-[-0.04em] text-white">{item.value}</p>
                      <p className="mt-2 text-sm tracking-[-0.01em] text-white/62">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-[#b0a7ff]">
                Built for teams
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                A landing page that feels premium, focused, and conversion-ready
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 tracking-[-0.01em] text-white/68">
                The structure follows the reference direction: a polished hero, clear value
                proposition, supportive trust signals, helpful FAQs, and a clean footer for a
                complete landing experience.
              </p>
            </div>

            <div id="why-us" className="grid gap-4 sm:grid-cols-3">
              {featureCards.map(({ title, description, icon: Icon }) => (
                <article
                  key={title}
                  className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,rgba(79,65,185,0.08)_100%)] p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4F41B9]/18 text-[#d4ceff]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-[-0.03em] text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-7 tracking-[-0.01em] text-white/65">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-5xl px-6 py-14 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-[#b0a7ff]">
              FAQ
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              Everything you need to know before starting
            </h2>
          </div>

          <div className="mt-10 space-y-4">
            {faqs.map((item) => (
              <details
                key={item.question}
                className="group rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-6 py-5 open:bg-white/[0.05]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-medium tracking-[-0.02em] text-white">
                  <span>{item.question}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-[#c8c2ff] transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pt-4 pr-12 text-sm leading-7 tracking-[-0.01em] text-white/68">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <footer id="contact" className="mx-auto max-w-7xl px-6 pb-10 pt-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(79,65,185,0.18)_0%,rgba(255,255,255,0.03)_100%)] px-8 py-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-[#b0a7ff]">
                  Ready to build
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                  Bring your next launch to life with a sharper visual presence
                </h2>
                <p className="mt-4 text-base leading-8 tracking-[-0.01em] text-white/68">
                  Use this landing page as the front door for your product, agency, or service and
                  expand the sections later as your content grows.
                </p>
              </div>

              <div className="flex flex-col gap-3 text-sm tracking-[-0.01em] text-white/62 sm:text-right">
                <a href="mailto:hello@ravenclaw.dev" className="text-white transition hover:text-[#d4ceff]">
                  hello@ravenclaw.dev
                </a>
                <p>RavenClaw Studio</p>
                <p>Crafted with a focused `#4F41B9` visual system.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
