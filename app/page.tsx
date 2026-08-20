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
import UnofficialNotice from "@/components/UnofficialNotice";
import RevealProvider from "@/components/RevealProvider";
import { readNextKickoff } from "@/lib/db-read";
import { getPublishedNews } from "@/lib/news";
import {
  getFixtures,
  getLegends,
  getResults,
  getSquad,
  getStandings,
  getTimeline,
} from "@/lib/queries";
import { getNextKickoff } from "@/lib/schedule";

/**
 * Sahifa har so'rovda qayta chiziladi.
 *
 * Statik keshlashda HTML build paytida yaratiladi, CI da esa baza
 * yo'q — natijada deploy'dan keyin bir muddat standart yangiliklar
 * ko'rinib qolardi. SQLite o'qish tez, shuning uchun dinamik qilamiz.
 * Tashqi API javoblari baribir bir soat keshlanadi (lib/sportsdb.ts).
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Server komponentida ma'lumot olinadi — backend qo'shilganda
  // faqat lib/queries.ts o'zgaradi, bu yer o'sha-o'shaligicha qoladi.
  const [squad, fixtures, results, standingsData, timeline, legends, news, nextMatch] =
    await Promise.all([
      getSquad(),
      getFixtures(),
      getResults(),
      getStandings(),
      getTimeline(),
      getLegends(),
      getPublishedNews(),
      readNextKickoff(),
    ]);

  return (
    <>
      <RevealProvider />
      <Header />
      <main>
        <Hero />
        <UnofficialNotice />
        <NextMatch
          kickoff={(nextMatch?.kickoff ?? getNextKickoff()).toISOString()}
          match={
            nextMatch
              ? {
                  home: nextMatch.home,
                  away: nextMatch.away,
                  competition: nextMatch.competition,
                  venue: nextMatch.venue,
                }
              : undefined
          }
        />
        <News items={news} />
        <Matches fixtures={fixtures} results={results} />
        <Squad players={squad} />
        <Standings
        rows={standingsData.rows}
        season={standingsData.season}
        isPreviousSeason={standingsData.isPreviousSeason}
      />
        <Timeline items={timeline} />
        <Legends items={legends} />
        <FanClub />
      </main>
      <Footer />
      <ToTop />
    </>
  );
}
