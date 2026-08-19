import Header from "@/components/Header";
import Hero from "@/components/Hero";
import NextMatch from "@/components/NextMatch";
import News from "@/components/News";
import Matches from "@/components/Matches";
import Squad from "@/components/Squad";
import Standings from "@/components/Standings";
import Timeline from "@/components/Timeline";
import Legends from "@/components/Legends";
import FanClub from "@/components/FanClub";
import Footer from "@/components/Footer";
import ToTop from "@/components/ToTop";
import RevealProvider from "@/components/RevealProvider";
import {
  getFixtures,
  getLegends,
  getResults,
  getSquad,
  getStandings,
  getTimeline,
} from "@/lib/queries";
import { getNextKickoff } from "@/lib/schedule";

export default async function HomePage() {
  // Server komponentida ma'lumot olinadi — backend qo'shilganda
  // faqat lib/queries.ts o'zgaradi, bu yer o'sha-o'shaligicha qoladi.
  const [squad, fixtures, results, standings, timeline, legends] =
    await Promise.all([
      getSquad(),
      getFixtures(),
      getResults(),
      getStandings(),
      getTimeline(),
      getLegends(),
    ]);

  return (
    <>
      <RevealProvider />
      <Header />
      <main>
        <Hero />
        <NextMatch kickoff={getNextKickoff().toISOString()} />
        <News />
        <Matches fixtures={fixtures} results={results} />
        <Squad players={squad} />
        <Standings rows={standings} />
        <Timeline items={timeline} />
        <Legends items={legends} />
        <FanClub />
      </main>
      <Footer />
      <ToTop />
    </>
  );
}
